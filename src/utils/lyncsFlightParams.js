import dayjs from "dayjs";
import { resolveAirportCode } from "./airports";

/**
 * Builds Lyncs flight-widget search params pre-filled from a training
 * record, per FLIGHT_URL_INTEGRATION_GUIDE.md. Departure/destination are
 * resolved to IATA codes via resolveAirportCode() rather than passed as raw
 * text; a param is simply omitted (not sent as an empty string) when
 * nothing resolves, letting the widget prompt the user for it instead.
 *
 * @param {object} training
 * @returns {Record<string, string>} search params to append to the widget path
 */
export function buildLyncsFlightSearchParams(training) {
  const params = {};

  const from = resolveAirportCode(training?.FROM);
  const to = resolveAirportCode(training?.STATE);

  if (from) params.from = from;
  if (to) params.to = to;

  if (training?.START_DATE) {
    params.date = dayjs(training.START_DATE).format("YYYY-MM-DD");
    params.trip_type = "one-way";
  }

  params.adults = "1";
  params.class = "Economy";
  params.auto_search = "true";

  return params;
}
