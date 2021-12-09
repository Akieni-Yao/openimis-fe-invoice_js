import React, { useState, useCallback, useEffect, useRef } from "react";
import { injectIntl } from "react-intl";
import {
  withModulesManager,
  formatMessage,
  formatMessageWithValues,
  Searcher,
  formatDateFromISO,
  coreConfirm,
  journalize,
  withHistory,
  historyPush,
} from "@openimis/fe-core";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { fetchInvoices, deleteInvoice } from "../actions";
import {
  DEFAULT_PAGE_SIZE,
  ROWS_PER_PAGE_OPTIONS,
  EMPTY_STRING,
  RIGHT_INVOICE_UPDATE,
  RIGHT_INVOICE_DELETE,
  STATUS,
} from "../constants";
import InvoiceFilter from "./InvoiceFilter";
import InvoiceStatusPicker from "../pickers/InvoiceStatusPicker";
import { getSubjectAndThirdpartyTypePicker } from "../util/subject-and-thirdparty-picker";
import { IconButton, Tooltip } from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { getInvoiceStatus } from "../util/invoice-status";

const InvoiceSearcher = ({
  intl,
  modulesManager,
  history,
  rights,
  coreConfirm,
  confirmed,
  journalize,
  submittingMutation,
  mutation,
  fetchInvoices,
  deleteInvoice,
  fetchingInvoices,
  fetchedInvoices,
  errorInvoices,
  invoices,
  invoicesPageInfo,
  invoicesTotalCount,
}) => {
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deletedInvoiceUuids, setDeletedInvoiceUuids] = useState([]);
  const prevSubmittingMutationRef = useRef();

  useEffect(() => invoiceToDelete && openConfirmDialog(), [invoiceToDelete]);

  useEffect(() => {
    if (invoiceToDelete && confirmed) {
      confirmedAction();
      setDeletedInvoiceUuids([...deletedInvoiceUuids, invoiceToDelete.id]);
    }
    invoiceToDelete && confirmed !== null && setInvoiceToDelete(null);
  }, [confirmed]);

  useEffect(() => {
    prevSubmittingMutationRef.current && !submittingMutation && journalize(mutation);
  }, [submittingMutation]);

  useEffect(() => {
    prevSubmittingMutationRef.current = submittingMutation;
  });

  const confirmedAction = useCallback(
    () =>
      deleteInvoice(
        invoiceToDelete,
        formatMessageWithValues(intl, "invoice", "delete.mutationLabel", {
          code: invoiceToDelete.code,
        }),
      ),
    [invoiceToDelete],
  );

  const openConfirmDialog = useCallback(
    () =>
      coreConfirm(
        formatMessageWithValues(intl, "invoice", "delete.confirm.title", {
          code: invoiceToDelete.code,
        }),
        formatMessage(intl, "invoice", "delete.confirm.message"),
      ),
    [invoiceToDelete],
  );

  const fetch = (params) => fetchInvoices(params);

  const headers = () => {
    const headers = [
      "invoice.subject",
      "invoice.thirdparty",
      "invoice.code",
      "invoice.dateInvoice",
      "invoice.amountTotal",
      "invoice.status.label",
    ];
    if (rights.includes(RIGHT_INVOICE_UPDATE)) {
      headers.push("emptyLabel");
    }
    return headers;
  };

  const itemFormatters = () => {
    const formatters = [
      (invoice) => getSubjectAndThirdpartyTypePicker(modulesManager, invoice.subjectTypeName, invoice.subject),
      (invoice) => getSubjectAndThirdpartyTypePicker(modulesManager, invoice.thirdpartyTypeName, invoice.thirdparty),
      (invoice) => invoice.code,
      (invoice) =>
        !!invoice.dateInvoice ? formatDateFromISO(modulesManager, intl, invoice.dateInvoice) : EMPTY_STRING,
      (invoice) => invoice.amountTotal,
      (invoice) => <InvoiceStatusPicker value={getInvoiceStatus(invoice)} readOnly />,
    ];
    if (rights.includes(RIGHT_INVOICE_UPDATE)) {
      formatters.push((invoice) => (
        <Tooltip title={formatMessage(intl, "invoice", "edit.buttonTooltip")}>
          <IconButton
            href={invoiceUpdatePageUrl(invoice)}
            onClick={(e) => e.stopPropagation() && onDoubleClick(invoice)}
            disabled={deletedInvoiceUuids.includes(invoice.id)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    if (rights.includes(RIGHT_INVOICE_DELETE)) {
      formatters.push((invoice) => (
        <Tooltip title={formatMessage(intl, "invoice", "delete.buttonTooltip")}>
          <IconButton
            onClick={() => onDelete(invoice)}
            disabled={getInvoiceStatus(invoice) === STATUS.PAYED || deletedInvoiceUuids.includes(invoice.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ));
    }
    return formatters;
  };

  const rowIdentifier = (invoice) => invoice.id;

  const sorts = () => [
    ["subjectType", true],
    ["thirdpartyType", true],
    ["code", true],
    ["dateInvoice", true],
    ["amountTotal", true],
    ["status", true],
  ];

  const invoiceUpdatePageUrl = (invoice) => modulesManager.getRef("invoice.route.invoice") + "/" + invoice?.id;

  const onDoubleClick = (invoice, newTab = false) =>
    rights.includes(RIGHT_INVOICE_UPDATE) &&
    !deletedInvoiceUuids.includes(invoice.id) &&
    historyPush(modulesManager, history, "invoice.route.invoice", [invoice?.id], newTab);

  const onDelete = (invoice) => setInvoiceToDelete(invoice);

  const isRowDisabled = (_, invoice) => deletedInvoiceUuids.includes(invoice.id);

  const defaultFilters = () => ({
    isDeleted: {
      value: false,
      filter: "isDeleted: false",
    },
  });

  return (
    <Searcher
      module="contact"
      FilterPane={InvoiceFilter}
      fetch={fetch}
      items={invoices}
      itemsPageInfo={invoicesPageInfo}
      fetchingItems={fetchingInvoices}
      fetchedItems={fetchedInvoices}
      errorItems={errorInvoices}
      tableTitle={formatMessageWithValues(intl, "invoice", "invoices.searcher.resultsTitle", {
        invoicesTotalCount,
      })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      defaultOrderBy="code"
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      defaultFilters={defaultFilters()}
      rowDisabled={isRowDisabled}
      rowLocked={isRowDisabled}
    />
  );
};

const mapStateToProps = (state) => ({
  fetchingInvoices: state.invoice.fetchingInvoices,
  fetchedInvoices: state.invoice.fetchedInvoices,
  errorInvoices: state.invoice.errorInvoices,
  invoices: state.invoice.invoices,
  invoicesPageInfo: state.invoice.invoicesPageInfo,
  invoicesTotalCount: state.invoice.invoicesTotalCount,
  confirmed: state.core.confirmed,
  submittingMutation: state.invoice.submittingMutation,
  mutation: state.invoice.mutation,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      fetchInvoices,
      deleteInvoice,
      coreConfirm,
      journalize,
    },
    dispatch,
  );
};

export default withHistory(
  withModulesManager(injectIntl(connect(mapStateToProps, mapDispatchToProps)(InvoiceSearcher))),
);
