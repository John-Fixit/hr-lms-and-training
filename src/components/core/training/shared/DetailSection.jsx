import PropTypes from "prop-types";

/** Titled white card used inside detail drawers. */
export default function DetailSection({ title, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

DetailSection.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
};
