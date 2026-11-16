import type { CompareRow } from "../types";
import { ElementValue } from "./ElementValue";

interface ElementRowProps {
  readonly row: CompareRow;
  readonly leftMissing: boolean;
  readonly rightMissing: boolean;
  readonly showWordDiff: boolean;
}

const statusLabel = (status: CompareRow["status"]): string | null => {
  switch (status) {
    case "different":
      return "Different";
    case "empty-left":
    case "empty-right":
      return "Empty in one language";
    case "same":
      return "Same";
    case "empty-both":
      return "Empty";
    case "missing-left":
    case "missing-right":
      return "Missing variant";
    default:
      return null;
  }
};

const statusClass = (status: CompareRow["status"]): string => {
  switch (status) {
    case "different":
      return "badge badge--different";
    case "empty-left":
    case "empty-right":
      return "badge badge--empty";
    case "same":
      return "badge badge--same";
    case "empty-both":
      return "badge badge--muted";
    case "missing-left":
    case "missing-right":
      return "badge badge--missing";
    default:
      return "badge";
  }
};

export const ElementRow = ({
  row,
  leftMissing,
  rightMissing,
  showWordDiff,
}: ElementRowProps) => {
  const label = statusLabel(row.status);
  const isTextual = row.type === "text" || row.type === "url_slug";

  return (
    <tr className={`element-row element-row--${row.status}`}>
      <th scope="row" className="element-row__name">
        <div className="element-row__title">{row.name}</div>
        <div className="element-row__meta">
          <span className="element-row__type">{row.type}</span>
          {label && <span className={statusClass(row.status)}>{label}</span>}
        </div>
      </th>
      <td className="element-row__value">
        <ElementValue
          element={row.left}
          type={row.type}
          options={row.options}
          compareAgainst={showWordDiff && isTextual ? row.right : undefined}
          showWordDiff={showWordDiff && isTextual}
          missing={leftMissing}
        />
      </td>
      <td className="element-row__value">
        <ElementValue
          element={row.right}
          type={row.type}
          options={row.options}
          missing={rightMissing}
        />
      </td>
    </tr>
  );
};
