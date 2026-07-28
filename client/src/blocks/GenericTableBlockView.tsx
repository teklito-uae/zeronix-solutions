import type { GenericTableBlock } from "../lib/types";

export function GenericTableBlockView({
  block,
  onChange,
}: {
  block: GenericTableBlock;
  onChange: (b: GenericTableBlock) => void;
}) {
  function setHeader(i: number, val: string) {
    const headers = [...block.headers];
    headers[i] = val;
    onChange({ ...block, headers });
  }
  function setCell(r: number, c: number, val: string) {
    const rows = block.rows.map((row) => [...row]);
    rows[r][c] = val;
    onChange({ ...block, rows });
  }
  function addColumn() {
    onChange({
      ...block,
      headers: [...block.headers, `COLUMN ${block.headers.length + 1}`],
      rows: block.rows.map((r) => [...r, ""]),
    });
  }
  function addRow() {
    onChange({ ...block, rows: [...block.rows, block.headers.map(() => "")] });
  }
  function removeRow(idx: number) {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) });
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-green-50 text-green-900">
            {block.headers.map((h, i) => (
              <th key={i} className="p-1 text-left">
                <input
                  value={h}
                  onChange={(e) => setHeader(i, e.target.value)}
                  className="w-full bg-transparent outline-none font-semibold p-1"
                />
              </th>
            ))}
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, r) => (
            <tr key={r} className="border-t border-gray-100">
              {row.map((cell, c) => (
                <td key={c} className="p-1">
                  <input
                    value={cell}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    className="w-full outline-none p-1"
                  />
                </td>
              ))}
              <td className="p-1 text-center">
                <button onClick={() => removeRow(r)} className="text-gray-400 hover:text-red-500">
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 p-2 border-t border-gray-100 bg-gray-50">
        <button onClick={addRow} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
          + Add Row
        </button>
        <button onClick={addColumn} className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100">
          + Add Column
        </button>
      </div>
    </div>
  );
}
