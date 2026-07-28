<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function show()
    {
        return response()->json(Company::singleton());
    }

    public function update(Request $request)
    {
        $b = $request->all();
        $company = Company::singleton();
        $company->update([
            'name' => $b['name'] ?? '',
            'address' => $b['address'] ?? '',
            'trn' => $b['trn'] ?? '',
            'phone' => $b['phone'] ?? '',
            'email' => $b['email'] ?? '',
            'logo_data_url' => $b['logo_data_url'] ?? '',
            'logo_dark_data_url' => $b['logo_dark_data_url'] ?? '',
            'default_payment_terms' => $b['default_payment_terms'] ?? '',
            'default_terms' => $b['default_terms'] ?? '',
            'default_signatory' => $b['default_signatory'] ?? '',
        ]);

        return response()->json($company->fresh());
    }
}
