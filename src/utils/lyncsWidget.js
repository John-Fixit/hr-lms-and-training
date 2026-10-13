/**
 * Lyncs embed SDK (loaded via index.html → client.js).
 * @see https://lyncs-web-widget.netlify.app/client.js
 */

export const LYNCS_WIDGET_KEY =
  "a3a2d99285894aa88b4340436fb7733151cffe74dc6870c214ecc0";

export const LYNCS_FLIGHT_PATH = "/flights/local-flight";

/** @returns {boolean} */
export const isLyncsWidgetAvailable = () =>
  typeof window !== "undefined" &&
  typeof window.LyncsWidget?.open === "function";

/**
 * Build plain profile payload for the widget.
 * Later: replace `data` with an encrypted blob via encryptLyncsProfilePayload().
 */
export const buildLyncsFlightPayload = (profile, companyName = "NCAA") => {
  const biodata = profile?.BIODATA;
  const contact = profile?.CONTACT_INFORMATION;

  return {
    status: true,
    name: biodata?.LAST_NAME
      ? `${biodata.LAST_NAME} ${biodata.FIRST_NAME ?? ""}`.trim()
      : "",
    company: companyName,
    phone: contact?.PHONE ?? "",
    email: contact?.EMAIL ?? "",
    dateOfBirth: biodata?.DATE_OF_BIRTH ?? "",
    bank: "",
    account_no: "",
    remita_code: "",
    staff_id: profile?.staff_id ?? "",
  };
};

/**
 * Opens the Lyncs flight booking widget via the official SDK.
 *
 * @param {object} options
 * @param {object} [options.data] - User/context passed to Lyncs (plain or encrypted)
 * @param {Record<string, string>} [options.searchParams] - Appended as a query string onto LYNCS_FLIGHT_PATH
 * @param {() => void} [options.onReady] - Fired when the widget UI is ready
 * @param {(error: Error) => void} [options.onError] - Fired if SDK is missing or open fails
 */
export const openLyncsFlightWidget = ({
  data = {},
  searchParams,
  onReady,
  onError,
} = {}) => {
  if (!isLyncsWidgetAvailable()) {
    const err = new Error(
      "Lyncs widget SDK is not loaded. Ensure client.js is included in index.html.",
    );
    onError?.(err);
    return false;
  }

  try {
    const query = searchParams
      ? new URLSearchParams(searchParams).toString()
      : "";
    const path = query ? `${LYNCS_FLIGHT_PATH}?${query}` : LYNCS_FLIGHT_PATH;

    window.LyncsWidget.open({
      key: LYNCS_WIDGET_KEY,
      path,
      onReady: () => onReady?.(),
      data,
    });
    return true;
  } catch (error) {
    onError?.(error);
    return false;
  }
};
