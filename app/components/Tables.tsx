export type Column<T> = {
  key: keyof T; 
  label: string;
  render?:(row: T) => React.ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  actions?: (row: T) => React.ReactNode;
};

export default function Tables <T>({data,columns,actions}:TableProps<T>){
  return(
      <div className="overflow-x-auto rounded-lg shadow-md">
<table className="w-full border border-gray-300 rounded-lg overflow-hidden">
  <thead className="bg-gray-200 text-gray-700 uppercase text-sm">
    <tr>
      {columns.map((column) => (
        <th key={column.key as string} className="p-3 border text-left">
          {column.label}
        </th>
      ))}
      {actions && <th className="p-3 border text-center">Actions</th>}
    </tr>
  </thead>
  <tbody>
    {data.length > 0 ? (
      data.map((row, index) => (
        <tr
          key={index}
          className={`border ${
            index % 2 === 0 ? "bg-white" : "bg-gray-50"
          } hover:bg-gray-100 transition`}
        >
          {columns.map((column) => (
            <td key={column.key as string} className="p-3 border text-left">
              {row[column.key] as React.ReactNode}
            </td>
          ))}
          {actions && (
            <td className="p-3 border text-center">{actions(row)}</td>
          )}
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan={columns.length + 1}
          className="text-center p-4 text-gray-500"
        >
          No data available
        </td>
      </tr>
    )}
  </tbody>
</table>
</div>

  )
}