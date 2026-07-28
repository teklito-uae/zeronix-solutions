<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>{{ $metaTitle }} — {{ $company->name }}</title>

<meta name="description" content="{{ $metaDescription }}"/>

<meta property="og:type" content="website"/>
<meta property="og:title" content="{{ $metaTitle }}"/>
<meta property="og:description" content="{{ $metaDescription }}"/>
<meta property="og:site_name" content="{{ $company->name }}"/>

<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="{{ $metaTitle }}"/>
<meta name="twitter:description" content="{{ $metaDescription }}"/>

<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: "Segoe UI", system-ui, Roboto, sans-serif;
    background: #f4f5f7;
    color: #1f2430;
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  header {
    background: #120c2e;
    color: #fff;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  header img { height: 32px; object-fit: contain; }
  header .name { font-weight: 700; font-size: 15px; }
  main {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .summary {
    background: #fff;
    border: 1px solid #e2e5eb;
    border-radius: 10px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .summary h1 { margin: 0 0 4px; font-size: 18px; color: #120c2e; }
  .summary p { margin: 0; font-size: 13px; color: #6b7280; }
  .actions { display: flex; gap: 8px; }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid transparent;
  }
  .btn-primary { background: #120c2e; color: #fff; }
  .btn-outline { background: #fff; color: #120c2e; border-color: #d7dae0; }
  .viewer {
    flex: 1;
    min-height: 70vh;
    background: #fff;
    border: 1px solid #e2e5eb;
    border-radius: 10px;
    overflow: hidden;
  }
  .viewer iframe { width: 100%; height: 100%; min-height: 70vh; border: none; display: block; }
  footer { text-align: center; padding: 16px; font-size: 12px; color: #9aa0ab; }
</style>
</head>
<body>
  <header>
    @if ($company->logo_dark_data_url)
      <img src="{{ $company->logo_dark_data_url }}" alt="{{ $company->name }}"/>
    @else
      <span class="name">{{ $company->name }}</span>
    @endif
  </header>

  <main>
    <div class="summary">
      <div>
        <h1>{{ $quote->title }}</h1>
        <p>
          {{ $quote->quote_no }}
          @if ($clientName) &middot; Prepared for {{ $clientName }} @endif
        </p>
      </div>
      <div class="actions">
        <a class="btn btn-outline" href="{{ url("/share/{$quote->share_token}/pdf") }}" target="_blank" rel="noopener">View PDF</a>
        <a class="btn btn-primary" href="{{ url("/share/{$quote->share_token}/pdf?download=1") }}">Download PDF</a>
      </div>
    </div>

    <div class="viewer">
      <iframe src="{{ url("/share/{$quote->share_token}/pdf") }}" title="{{ $quote->title }}"></iframe>
    </div>
  </main>

  <footer>Sent via {{ $company->name }}</footer>
</body>
</html>
