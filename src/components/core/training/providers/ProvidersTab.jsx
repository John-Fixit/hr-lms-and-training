import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { Button, Dropdown, Input, Segmented, Select, Switch, Table } from "antd";
import { Building2, Download, MapPin, MoreHorizontal, Search } from "lucide-react";
import { useGetProviders } from "../../../../API/trainingProviders";
import { CARD_CLASS } from "../shared/trainingTheme";
import { LOCATIONS } from "../catalogue/catalogueConstants";
import {
  ActiveBadge,
  DocumentAlertBadge,
  ExpiryBadge,
  ProviderLogo,
  ProviderTypeBadge,
  RatingValue,
} from "./ProviderBadges";
import { DEFAULT_PROVIDER_FILTERS, PROVIDER_TYPES, getProviderType } from "./providersConstants";

export default function ProvidersTab({ filters, onFiltersChange, onOpenProvider, actions }) {
  const { data: providers = [], isPending } = useGetProviders();

  const update = useCallback(
    (patch) => onFiltersChange((prev) => ({ ...prev, ...patch })),
    [onFiltersChange],
  );

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return providers.filter(
      (p) =>
        (filters.status === "all" || p.STATUS === filters.status) &&
        (!filters.provider_type || p.PROVIDER_TYPE === filters.provider_type) &&
        (!filters.location || p.LOCATION === filters.location) &&
        (!filters.alerts_only || p.DOCUMENT_ALERT) &&
        (!term ||
          [p.PROVIDER_NAME, p.CONTACT_PERSON, p.CITY, p.COUNTRY, ...(p.SERVICES ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [providers, filters]);

  const exportToExcel = () => {
    const rows = filtered.map((p, i) => ({
      "S/N": i + 1,
      Provider: p.PROVIDER_NAME,
      Type: getProviderType(p.PROVIDER_TYPE).label,
      Location: [p.CITY, p.COUNTRY].filter(Boolean).join(", "),
      "Contact person": p.CONTACT_PERSON,
      Email: p.EMAIL,
      Phone: p.PHONE,
      Accreditation: p.ACCREDITATION,
      "Accreditation expiry": p.ACCREDITATION_EXPIRY ?? "",
      Services: (p.SERVICES ?? []).join(", "),
      Sessions: p.ENGAGEMENTS,
      "Average rating": p.AVERAGE_RATING ?? "",
      Status: p.STATUS,
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Providers");
    XLSX.writeFile(book, "training-providers.xlsx");
  };

  const columns = [
    {
      title: "Provider",
      key: "provider",
      sorter: (a, b) => a.PROVIDER_NAME.localeCompare(b.PROVIDER_NAME),
      render: (_, p) => (
        <div className="flex items-center gap-3">
          <ProviderLogo name={p.PROVIDER_NAME} type={p.PROVIDER_TYPE} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0f172a]">{p.PROVIDER_NAME}</p>
            <p className="flex items-center gap-1 text-xs text-[#64748b]">
              <MapPin size={11} />
              {[p.CITY, p.COUNTRY].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      key: "type",
      render: (_, p) => <ProviderTypeBadge type={p.PROVIDER_TYPE} />,
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, p) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="truncate text-[13px] text-[#344054]">{p.CONTACT_PERSON || "—"}</p>
          {p.EMAIL && <p className="truncate text-xs text-[#64748b]">{p.EMAIL}</p>}
        </div>
      ),
    },
    {
      title: "Accreditation",
      key: "accreditation",
      render: (_, p) =>
        p.ACCREDITATION ? (
          <div className="max-w-[220px] space-y-1">
            <p className="truncate text-[13px] text-[#344054]" title={p.ACCREDITATION}>
              {p.ACCREDITATION}
            </p>
            {p.ACCREDITATION_EXPIRY && <ExpiryBadge date={p.ACCREDITATION_EXPIRY} showDate={false} />}
          </div>
        ) : (
          <span className="text-xs text-[#94a3b8]">—</span>
        ),
    },
    {
      title: "Sessions",
      key: "sessions",
      align: "center",
      sorter: (a, b) => a.ENGAGEMENTS - b.ENGAGEMENTS,
      render: (_, p) => (
        <div>
          <p className="tabular-nums text-[13px] text-[#344054]">{p.ENGAGEMENTS}</p>
          {p.LAST_ENGAGED && (
            <p className="text-[11px] text-[#94a3b8]">Last {dayjs(p.LAST_ENGAGED).format("MMM YYYY")}</p>
          )}
        </div>
      ),
    },
    {
      title: "Rating",
      key: "rating",
      sorter: (a, b) => (a.AVERAGE_RATING ?? 0) - (b.AVERAGE_RATING ?? 0),
      render: (_, p) => <RatingValue value={p.AVERAGE_RATING} size="sm" />,
    },
    {
      title: "Alerts",
      key: "alerts",
      render: (_, p) => (
        <div className="flex flex-wrap gap-1">
          <ActiveBadge status={p.STATUS} />
          <DocumentAlertBadge alert={p.DOCUMENT_ALERT} />
          {p.STATUS === "ACTIVE" && !p.DOCUMENT_ALERT && <span className="text-xs text-[#94a3b8]">—</span>}
        </div>
      ),
    },
    {
      title: <span className="sr-only">Actions</span>,
      key: "actions",
      align: "right",
      render: (_, p) => (
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <Dropdown
            trigger={["click"]}
            menu={{ items: actions.providerMenu(p), onClick: ({ key }) => actions.runProviderAction(key, p) }}
          >
            <Button type="text" aria-label={`Actions for ${p.PROVIDER_NAME}`} icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        </div>
      ),
    },
  ];

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_PROVIDER_FILTERS);

  return (
    <div className="space-y-4">
      <section className={`${CARD_CLASS} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Input
            allowClear
            size="large"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search name, contact, city or service"
            prefix={<Search size={15} className="text-[#94a3b8]" />}
            className="lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={filters.status}
              onChange={(value) => update({ status: value })}
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "all", label: "All" },
              ]}
            />
            <Button icon={<Download size={15} />} onClick={exportToExcel} disabled={!filtered.length}>
              Export
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            allowClear
            virtual={false}
            value={filters.provider_type}
            onChange={(value) => update({ provider_type: value })}
            placeholder="Any type"
            options={PROVIDER_TYPES.map(({ value, label }) => ({ value, label }))}
          />
          <Select
            allowClear
            virtual={false}
            value={filters.location}
            onChange={(value) => update({ location: value })}
            placeholder="Local or foreign"
            options={LOCATIONS}
          />
          <label className="flex items-center gap-2 text-sm text-[#344054]">
            <Switch
              size="small"
              checked={filters.alerts_only}
              onChange={(checked) => update({ alerts_only: checked })}
            />
            Document alerts only
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-[#344054]">
          <span className="text-lg font-bold tabular-nums text-[#0f172a]">{filtered.length}</span>{" "}
          provider{filtered.length === 1 ? "" : "s"}
        </p>
        {isFiltered && (
          <Button type="link" size="small" className="!px-1" onClick={() => onFiltersChange(DEFAULT_PROVIDER_FILTERS)}>
            Reset filters
          </Button>
        )}
      </div>

      <section className={`${CARD_CLASS} overflow-hidden`}>
        <Table
          rowKey="PROVIDER_ID"
          columns={columns}
          dataSource={filtered}
          loading={isPending}
          scroll={{ x: 1180 }}
          onRow={(p) => ({ onClick: () => onOpenProvider(p.PROVIDER_ID), className: "cursor-pointer" })}
          pagination={{ pageSize: 10, hideOnSinglePage: true, className: "!px-4" }}
          locale={{
            emptyText: (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                  <Building2 size={22} />
                </span>
                <p className="text-sm font-semibold text-[#0f172a]">No providers found</p>
                <p className="text-xs text-[#64748b]">Try another status or clear the filters.</p>
              </div>
            ),
          }}
        />
      </section>
    </div>
  );
}

ProvidersTab.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onOpenProvider: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    providerMenu: PropTypes.func.isRequired,
    runProviderAction: PropTypes.func.isRequired,
  }).isRequired,
};
