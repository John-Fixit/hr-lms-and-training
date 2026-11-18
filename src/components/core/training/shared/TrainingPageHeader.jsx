import { Button } from "antd";
import PropTypes from "prop-types";
import { FileDown } from "lucide-react";
import { Link } from "react-router-dom";

export default function TrainingPageHeader({
  header_text,
  breadCrumb_data = [],
  buttonProp = [],
  subtitle = "Human Resources / Training",
}) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {breadCrumb_data.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true" className="text-slate-300">/</span>}
                {item.path ? (
                  <Link
                    to={item.path}
                      className="transition-colors hover:text-[#4F46E5]"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span>{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-1 h-8 w-1 shrink-0 rounded-full bg-[#6366F1]"
          />
          <div className="min-w-0">
            <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[1.75rem]">
              {header_text}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {buttonProp.length > 0 && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {buttonProp.map((item, index) => {
            const isPrimary = index === 0 && item.button_type !== "download";
            return (
              <Button
                key={`${item.button_text}-${index}`}
                type={isPrimary ? "primary" : "default"}
                icon={item.button_type === "download" ? <FileDown size={16} /> : null}
                loading={item.fnLoading}
                onClick={() => item.fn?.(item.fnParameter)}
                className={
                  isPrimary
                    ? "h-10 w-full rounded-lg border-[#6366F1] bg-[#6366F1] px-4 font-semibold shadow-sm hover:border-[#4F46E5] hover:bg-[#4F46E5] sm:w-auto"
                    : "h-10 w-full rounded-lg border-slate-200 px-4 font-medium text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                }
              >
                {item.button_text}
              </Button>
            );
          })}
        </div>
      )}
    </header>
  );
}

TrainingPageHeader.propTypes = {
  header_text: PropTypes.string.isRequired,
  breadCrumb_data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string,
    }),
  ),
  subtitle: PropTypes.string,
  buttonProp: PropTypes.arrayOf(
    PropTypes.shape({
      button_text: PropTypes.string.isRequired,
      button_type: PropTypes.string,
      fn: PropTypes.func,
      fnParameter: PropTypes.any,
      fnLoading: PropTypes.bool,
    }),
  ),
};
