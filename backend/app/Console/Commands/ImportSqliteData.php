<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Services\QuoteTotalsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class ImportSqliteData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-sqlite {path=../server/data/zeronix.db : Path to the old SQLite database file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import company/clients/catalog_items/quotes from the old Node/SQLite database into MySQL';

    public function handle(QuoteTotalsService $totals): int
    {
        $path = $this->resolvePath((string) $this->argument('path'));

        if (!file_exists($path)) {
            $this->error("SQLite file not found: {$path}");

            return self::FAILURE;
        }

        $this->info("Importing from {$path}");

        $pdo = new PDO('sqlite:'.$path);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        $counts = [
            'company' => $this->importCompany($pdo),
            'clients' => $this->importClients($pdo),
            'catalog_items' => $this->importCatalogItems($pdo),
            'quotes' => $this->importQuotes($pdo, $totals),
        ];

        $this->newLine();
        $this->info('Import summary:');
        foreach ($counts as $table => $count) {
            $this->line("  {$table}: {$count} row(s)");
        }

        return self::SUCCESS;
    }

    private function resolvePath(string $path): string
    {
        if (preg_match('#^([A-Za-z]:\\\\|/)#', $path)) {
            return $path;
        }

        return base_path($path);
    }

    private function importCompany(PDO $pdo): int
    {
        $row = $pdo->query('SELECT * FROM company WHERE id = 1')->fetch();
        if (!$row) {
            return 0;
        }

        $company = Company::singleton();
        $company->update([
            'name' => $row['name'] ?? $company->name,
            'address' => $row['address'] ?? '',
            'trn' => $row['trn'] ?? '',
            'phone' => $row['phone'] ?? '',
            'email' => $row['email'] ?? '',
            'logo_data_url' => $row['logo_data_url'] ?? '',
            'logo_dark_data_url' => $row['logo_dark_data_url'] ?? '',
            'default_payment_terms' => $row['default_payment_terms'] ?? '',
            'default_terms' => $row['default_terms'] ?? '',
            'default_signatory' => $row['default_signatory'] ?? '',
        ]);

        return 1;
    }

    private function importClients(PDO $pdo): int
    {
        $rows = $pdo->query('SELECT * FROM clients')->fetchAll();
        $count = 0;

        foreach ($rows as $row) {
            $createdAt = $row['created_at'] ?? now();
            DB::table('clients')->updateOrInsert(
                ['id' => $row['id']],
                [
                    'name' => $row['name'] ?? '',
                    'company' => $row['company'] ?? '',
                    'address' => $row['address'] ?? '',
                    'phone' => $row['phone'] ?? '',
                    'email' => $row['email'] ?? '',
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );
            $count++;
        }

        $this->syncAutoIncrement('clients');

        return $count;
    }

    private function importCatalogItems(PDO $pdo): int
    {
        $rows = $pdo->query('SELECT * FROM catalog_items')->fetchAll();
        $count = 0;

        foreach ($rows as $row) {
            $createdAt = $row['created_at'] ?? now();
            DB::table('catalog_items')->updateOrInsert(
                ['id' => $row['id']],
                [
                    'description' => $row['description'] ?? '',
                    'scope' => $row['scope'] ?? '',
                    'unit' => $row['unit'] ?? '1',
                    'unit_price' => $row['unit_price'] ?? 0,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );
            $count++;
        }

        $this->syncAutoIncrement('catalog_items');

        return $count;
    }

    private function importQuotes(PDO $pdo, QuoteTotalsService $totalsService): int
    {
        $rows = $pdo->query('SELECT * FROM quotes')->fetchAll();
        $count = 0;

        foreach ($rows as $row) {
            $blocks = json_decode($row['blocks'] ?? '[]', true) ?? [];
            $totals = $totalsService->compute($blocks);
            $createdAt = $row['created_at'] ?? now();
            $updatedAt = $row['updated_at'] ?? $createdAt;

            DB::table('quotes')->updateOrInsert(
                ['id' => $row['id']],
                [
                    'quote_no' => $row['quote_no'],
                    'quote_date' => $row['quote_date'],
                    'due_date' => $row['due_date'] ?: null,
                    'client_id' => $row['client_id'] ?: null,
                    'status' => $row['status'] ?? 'draft',
                    'title' => $row['title'] ?? 'Untitled Quote',
                    'blocks' => json_encode($blocks),
                    'subtotal_amount' => $totals['subtotal'],
                    'vat_amount' => $totals['vat'],
                    'grand_total_amount' => $totals['grand_total'],
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]
            );
            $count++;
        }

        $this->syncAutoIncrement('quotes');

        return $count;
    }

    /**
     * Since we preserve the old SQLite row IDs on insert, make sure the
     * MySQL AUTO_INCREMENT counter is bumped past the highest imported ID so
     * future inserts (new quotes/clients/etc. created via the app) don't
     * collide with imported rows.
     */
    private function syncAutoIncrement(string $table): void
    {
        $maxId = (int) DB::table($table)->max('id');
        if ($maxId > 0) {
            DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = ".($maxId + 1));
        }
    }
}
