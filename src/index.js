import messages_en from "./translations/en.json";
import reducer from "./reducer";
import flatten from "flat";
import LegalAndFinanceMainMenu from "./menus/LegalAndFinanceMainMenu";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceStatusPicker from "./pickers/InvoiceStatusPicker";

const ROUTE_INVOICES = "invoices";

const DEFAULT_CONFIG = {
  "translations": [{ key: "en", messages: flatten(messages_en) }],
  "reducers": [{ key: "invoice", reducer }],
  "core.MainMenu": [LegalAndFinanceMainMenu],
  "core.Router": [{ path: ROUTE_INVOICES, component: InvoicesPage }],
  "refs": [{ key: "invoice.InvoiceStatusPicker", ref: InvoiceStatusPicker }],
};

export const InvoiceModule = (cfg) => {
  return { ...DEFAULT_CONFIG, ...cfg };
};
