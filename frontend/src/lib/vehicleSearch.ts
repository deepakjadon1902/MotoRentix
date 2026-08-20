import type { Vehicle } from "@/lib/types";

const normalize = (value?: string | number) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[_/-]+/g, " ")
    .replace(/[^\w\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const numbersIn = (query: string) =>
  Array.from(query.matchAll(/\d+(?:\.\d+)?/g)).map((match) => Number(match[0])).filter((value) => Number.isFinite(value));

const vehiclePrices = (vehicle: Vehicle) => ({
  hour: Number(vehicle.pricePerHour || 0),
  day: Number(vehicle.pricePerDay || 0),
  week: Number(vehicle.pricePerWeek || vehicle.pricePerDay * 7 || 0),
  month: Number(vehicle.pricePerMonth || 0),
  deposit: Number(vehicle.securityDeposit || 0),
});

const priceMatches = (vehicle: Vehicle, query: string) => {
  const values = vehiclePrices(vehicle);
  const prices = Object.values(values).filter((value) => value > 0);
  const queryNumbers = numbersIn(query);
  if (queryNumbers.length === 0) return true;

  const mentionsHour = /\b(hour|hr|hourly)\b/.test(query);
  const mentionsDay = /\b(day|daily)\b/.test(query);
  const mentionsWeek = /\b(week|weekly)\b/.test(query);
  const mentionsMonth = /\b(month|monthly)\b/.test(query);
  const mentionsDeposit = /\b(deposit|security)\b/.test(query);
  const scopedPrices = [
    ...(mentionsHour ? [values.hour] : []),
    ...(mentionsDay ? [values.day] : []),
    ...(mentionsWeek ? [values.week] : []),
    ...(mentionsMonth ? [values.month] : []),
    ...(mentionsDeposit ? [values.deposit] : []),
  ].filter((value) => value > 0);
  const candidates = scopedPrices.length ? scopedPrices : prices;

  const wantsMax = /\b(under|below|less|upto|up to|max|maximum|within|budget)\b/.test(query);
  const wantsMin = /\b(above|over|more|from|min|minimum)\b/.test(query);

  return queryNumbers.some((amount) => {
    if (wantsMax) return candidates.some((price) => price <= amount);
    if (wantsMin) return candidates.some((price) => price >= amount);
    return candidates.some((price) => Math.round(price) === Math.round(amount) || String(Math.round(price)).includes(String(Math.round(amount))));
  });
};

export const vehicleMatchesSearch = (vehicle: Vehicle, rawQuery: string) => {
  const query = normalize(rawQuery);
  if (!query) return true;

  const branch = vehicle.branchId && typeof vehicle.branchId === "object" ? vehicle.branchId : null;
  const prices = vehiclePrices(vehicle);
  const searchable = normalize([
    vehicle.name,
    vehicle.bikeNumber,
    vehicle.category,
    vehicle.category?.replace("_", " "),
    vehicle.description,
    vehicle.features?.join(" "),
    branch?.name,
    branch?.city,
    branch?.address,
    `hour ${prices.hour} hourly ${prices.hour} hr ${prices.hour}`,
    `day ${prices.day} daily ${prices.day}`,
    `week ${prices.week} weekly ${prices.week}`,
    `month ${prices.month} monthly ${prices.month}`,
    `deposit ${prices.deposit} security ${prices.deposit}`,
  ].filter(Boolean).join(" "));

  const tokens = query.split(" ").filter((token) => !/^\d+(?:\.\d+)?$/.test(token));
  const textMatches = tokens.length === 0 || tokens.every((token) => searchable.includes(token));

  return textMatches && priceMatches(vehicle, query);
};
