import PropTypes from "prop-types";

const DEFAULT_LOGO_SRC = "/assets/images/NCAA.png";

export default function FormHeader({ title, subtitle, className = "" }) {
  return (
    <header
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 md:px-5 md:py-4 my-2 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            <img
              src={DEFAULT_LOGO_SRC}
              alt="Organisation Logo"
              className="h-8 w-8 md:h-10 md:w-10 object-contain"
            />
          </div>

          <div className="min-w-0">
            <h2 className="font-helvetica text-base md:text-2xl font-semibold text-slate-800 truncate">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-xs md:text-sm text-slate-500 mt-0.5 truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

FormHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  className: PropTypes.string,
};
