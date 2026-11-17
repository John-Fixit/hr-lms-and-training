import PropTypes from "prop-types";
import { Button, Drawer, Dropdown, Empty, Skeleton } from "antd";
import { ChevronDown, FileText, Globe, Mail, MapPin, Pencil, Phone, Plus, UserRound } from "lucide-react";
import { useGetProvider } from "../../../../API/trainingProviders";
import DetailSection from "../shared/DetailSection";
import { CourseStatusBadge } from "../catalogue/CatalogueBadges";
import { formatNaira } from "../catalogue/catalogueConstants";
import { StaffAvatar } from "../skills/SkillBadges";
import {
  ActiveBadge,
  DocumentAlertBadge,
  ExpiryBadge,
  ProviderLogo,
  ProviderTypeBadge,
  RatingValue,
  TrainerTypeBadge,
} from "./ProviderBadges";
import { EngagementHistory, RatingBreakdown, StatRow } from "./ProviderPanels";
import { getDocumentTypeLabel, splitTrainerName } from "./providersConstants";

function ContactLine({ icon: Icon, children, href }) {
  if (!children) return null;
  const content = (
    <>
      <Icon size={14} className="shrink-0 text-[#94a3b8]" />
      <span className="truncate">{children}</span>
    </>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-2 text-sm text-[#4F46E5] hover:underline">
      {content}
    </a>
  ) : (
    <p className="flex items-center gap-2 text-sm text-[#344054]">{content}</p>
  );
}

ContactLine.propTypes = {
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node,
  href: PropTypes.string,
};

export default function ProviderDetailDrawer({ providerId, open, onClose, onOpenTrainer, actions }) {
  const { data: provider, isPending } = useGetProvider(open ? providerId : null);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(760px, 100vw)"
      title={<span className="font-helvetica">Provider profile</span>}
      classNames={{ body: "bg-[#F9FAFB] !p-4 sm:!p-6", header: "font-helvetica" }}
      destroyOnClose
      extra={
        provider && (
          <div className="flex gap-2">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: actions.providerMenu(provider).filter((item) => item.key !== "edit"),
                onClick: ({ key }) => actions.runProviderAction(key, provider),
              }}
            >
              <Button>
                More <ChevronDown size={14} className="inline" />
              </Button>
            </Dropdown>
            <Button type="primary" icon={<Pencil size={14} />} onClick={() => actions.runProviderAction("edit", provider)}>
              Edit
            </Button>
          </div>
        )
      }
    >
      {isPending ? (
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      ) : !provider ? (
        <Empty description="Provider could not be loaded." />
      ) : (
        <div className="space-y-4 font-helvetica">
          <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-start gap-4">
              <ProviderLogo name={provider.PROVIDER_NAME} type={provider.PROVIDER_TYPE} size={56} />
              <div className="min-w-0">
                <h3 className="text-xl font-bold leading-tight text-[#0f172a]">{provider.PROVIDER_NAME}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ProviderTypeBadge type={provider.PROVIDER_TYPE} />
                  <ActiveBadge status={provider.STATUS} />
                  <DocumentAlertBadge alert={provider.DOCUMENT_ALERT} />
                  <span className="flex items-center gap-1 text-xs text-[#64748b]">
                    <MapPin size={12} />
                    {[provider.CITY, provider.COUNTRY].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <StatRow
                stats={[
                  provider.ENGAGEMENTS != null && { label: "Sessions", value: provider.ENGAGEMENTS },
                  provider.PARTICIPANTS_TOTAL != null && { label: "Staff trained", value: provider.PARTICIPANTS_TOTAL },
                  provider.SPEND_TOTAL != null && { label: "Total spend", value: <span className="text-base">{formatNaira(provider.SPEND_TOTAL)}</span> },
                  { label: "Rating", value: <RatingValue value={provider.AVERAGE_RATING} /> },
                ].filter(Boolean)}
              />
            </div>
            {provider.SERVICES?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {provider.SERVICES.map((service) => (
                  <span key={service} className="rounded-md border border-[#e2e8f0] bg-[#F9FAFB] px-2 py-0.5 text-xs text-[#344054]">
                    {service}
                  </span>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailSection title="Contact">
              <div className="space-y-2">
                <ContactLine icon={UserRound}>{provider.CONTACT_PERSON}</ContactLine>
                <ContactLine icon={Mail} href={provider.EMAIL ? `mailto:${provider.EMAIL}` : undefined}>
                  {provider.EMAIL}
                </ContactLine>
                <ContactLine icon={Phone} href={provider.PHONE?.startsWith("+") ? `tel:${provider.PHONE.replace(/\s/g, "")}` : undefined}>
                  {provider.PHONE}
                </ContactLine>
                <ContactLine icon={Globe} href={provider.WEBSITE || undefined}>
                  {provider.WEBSITE?.replace(/^https?:\/\//, "")}
                </ContactLine>
                {!provider.CONTACT_PERSON && !provider.EMAIL && !provider.PHONE && (
                  <p className="text-sm text-[#94a3b8]">No contact details yet.</p>
                )}
              </div>
            </DetailSection>
            <DetailSection title="Participant ratings">
              <RatingBreakdown breakdown={provider.RATING_BREAKDOWN} />
            </DetailSection>
          </div>

          <DetailSection title="Accreditation & documents">
            {provider.ACCREDITATION ? (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F9FAFB] p-3">
                <p className="text-sm font-medium text-[#0f172a]">{provider.ACCREDITATION}</p>
                <ExpiryBadge date={provider.ACCREDITATION_EXPIRY} />
              </div>
            ) : (
              <p className="mb-3 text-sm text-[#94a3b8]">No accreditation recorded.</p>
            )}
            {provider.DOCUMENTS?.length ? (
              <ul className="divide-y divide-[#f1f5f9]">
                {provider.DOCUMENTS.map((d) => (
                  <li key={d.DOCUMENT_ID} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText size={16} className="shrink-0 text-[#94a3b8]" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[#0f172a]">{d.DOCUMENT_NAME}</p>
                        <p className="text-xs text-[#64748b]">{getDocumentTypeLabel(d.DOCUMENT_TYPE)}</p>
                      </div>
                    </div>
                    <ExpiryBadge date={d.EXPIRY_DATE} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#94a3b8]">No documents uploaded.</p>
            )}
          </DetailSection>

          <DetailSection
            title={`Trainers (${provider.TRAINERS?.length ?? 0})`}
            action={
              provider.STATUS === "ACTIVE" && (
                <Button size="small" icon={<Plus size={13} />} onClick={() => actions.runProviderAction("add_trainer", provider)}>
                  Add trainer
                </Button>
              )
            }
          >
            {provider.TRAINERS?.length ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {provider.TRAINERS.map((t) => {
                  const { first, last } = splitTrainerName(t.FULL_NAME);
                  return (
                    <li key={t.TRAINER_ID}>
                      <button
                        type="button"
                        onClick={() => onOpenTrainer(t.TRAINER_ID)}
                        className="flex w-full items-center gap-3 rounded-lg border border-[#e2e8f0] p-2.5 text-left outline-none transition-colors hover:border-[#6366F1]/50 focus-visible:ring-2 focus-visible:ring-[#6366F1]/40"
                      >
                        <StaffAvatar firstName={first} lastName={last} size={34} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-[#0f172a]">{t.FULL_NAME}</p>
                          <p className="truncate text-xs text-[#64748b]">{t.TITLE}</p>
                        </div>
                        {t.STATUS === "ACTIVE" ? <TrainerTypeBadge type={t.TRAINER_TYPE} /> : <ActiveBadge status={t.STATUS} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-[#94a3b8]">No trainers registered for this provider.</p>
            )}
          </DetailSection>

          <DetailSection title="Catalogue courses using this provider">
            {provider.COURSES?.length ? (
              <ul className="flex flex-wrap gap-2">
                {provider.COURSES.map((c) => (
                  <li key={c.COURSE_ID} className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#F9FAFB] px-2.5 py-1 text-xs text-[#344054]">
                    <span className="font-semibold">{c.COURSE_CODE}</span>
                    {c.COURSE_TITLE}
                    {c.STATUS !== "ACTIVE" && <CourseStatusBadge status={c.STATUS} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#94a3b8]">No catalogue course uses this provider as its default.</p>
            )}
          </DetailSection>

          <DetailSection title="Engagement history">
            <EngagementHistory engagements={provider.ENGAGEMENT_HISTORY} />
          </DetailSection>

          {provider.NOTES && (
            <DetailSection title="Notes">
              <p className="whitespace-pre-line text-sm text-[#344054]">{provider.NOTES}</p>
            </DetailSection>
          )}
        </div>
      )}
    </Drawer>
  );
}

ProviderDetailDrawer.propTypes = {
  providerId: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenTrainer: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    providerMenu: PropTypes.func.isRequired,
    runProviderAction: PropTypes.func.isRequired,
  }).isRequired,
};
