<?php

namespace App\Services;

class DefaultQuoteTemplate
{
    private static int $counter = 0;

    private static function id(string $prefix): string
    {
        self::$counter += 1;

        return sprintf('%s-%d-%d', $prefix, round(microtime(true) * 1000), self::$counter);
    }

    /**
     * Port of server/src/defaultTemplate.ts::buildDefaultBlocks(), verbatim.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function buildDefaultBlocks(): array
    {
        return [
            [
                'id' => self::id('cover'),
                'type' => 'cover',
                'title' => "IT Infrastructure\nProposal",
                'preparedFor' => 'CLIENT NAME',
                'preparedBy' => 'ZERONIX TECHNOLOGY LLC',
            ],
            ['id' => self::id('h'), 'type' => 'heading', 'text' => 'INTRODUCTION', 'number' => '1'],
            [
                'id' => self::id('rt'),
                'type' => 'richtext',
                'html' => '<p>Zeronix Technology LLC is pleased to submit this proposal to the client. Describe the project objective, scope, and approach here.</p>',
            ],
            ['id' => self::id('h'), 'type' => 'heading', 'text' => 'SCOPE OF WORK', 'number' => '2'],
            [
                'id' => self::id('rt'),
                'type' => 'richtext',
                'html' => '<ul><li><strong>Item 1</strong> — description of the work item.</li><li><strong>Item 2</strong> — description of the work item.</li></ul>',
            ],
            ['id' => self::id('h'), 'type' => 'heading', 'text' => 'TIMELINE & DELIVERABLES', 'number' => '3'],
            [
                'id' => self::id('table'),
                'type' => 'table',
                'headers' => ['DURATION', 'ACTIVITY'],
                'rows' => [
                    ['DAY 01', 'Preparation'],
                    ['DAY 02', 'Execution'],
                    ['DAY 03', 'Testing & Handover'],
                ],
            ],
            ['id' => self::id('h'), 'type' => 'heading', 'text' => 'COMMERCIAL PROPOSAL', 'number' => '4'],
            [
                'id' => self::id('pt'),
                'type' => 'pricetable',
                'vatPercent' => 5,
                'rows' => [
                    [
                        'id' => self::id('row'),
                        'description' => 'Sample Line Item',
                        'scope' => 'Scope description',
                        'unit' => 1,
                        'unitPrice' => 0,
                    ],
                ],
            ],
            ['id' => self::id('h'), 'type' => 'heading', 'text' => 'TERMS & CONDITIONS', 'number' => '5'],
            [
                'id' => self::id('rt'),
                'type' => 'richtext',
                'html' => '<ul><li>Payment terms: 60% advance, 40% on completion.</li><li>Add project-specific terms here.</li></ul>',
            ],
            ['id' => self::id('divider'), 'type' => 'divider'],
            [
                'id' => self::id('sig'),
                'type' => 'signature',
                'leftName' => 'ISMAIL THASRIF KM',
                'leftCompany' => 'Zeronix Technology LLC',
                'rightLabel' => 'Client Company',
            ],
        ];
    }
}
