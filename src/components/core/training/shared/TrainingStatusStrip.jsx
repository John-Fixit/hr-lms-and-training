import PropTypes from "prop-types";
import clsx from "clsx";
import { StatTile, StatTileSkeleton } from "./StatTile";

function gridFor(count) {
  if (count <= 2) return "grid-cols-2 lg:grid-cols-4";
  if (count === 3) return "grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "grid-cols-2 lg:grid-cols-4";
  return "grid-cols-2 lg:grid-cols-3";
}

/** Status KPI cards. Clicking a card selects that list. */
export default function TrainingStatusStrip({ items, active, onChange, loading = false }) {
  if (loading) return <StatTileSkeleton count={Math.max(items.length, 2)} />;

  return (
    <div className={clsx("grid gap-3", gridFor(items.length))}>
      {items.map((item) => {
        const count = item.count ?? 0;
        const selected = active === item.id;
        return (
          <StatTile
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={count}
            sub={item.sub}
            onClick={() => onChange(item.id)}
            selected={selected}
          />
        );
      })}
    </div>
  );
}

TrainingStatusStrip.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      count: PropTypes.number,
      sub: PropTypes.node,
    }),
  ).isRequired,
  active: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
