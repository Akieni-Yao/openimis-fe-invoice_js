import React from "react";
import { Helmet, withModulesManager, formatMessage } from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import { connect } from "react-redux";
import { RIGHT_INVOICE_SEARCH } from "../constants";
import InvoiceSearcher from "../components/InvoiceSearcher";
import { defaultPageStyles } from "../util/styles";

const InvoicesPage = ({ intl, classes, rights }) =>
  rights.includes(RIGHT_INVOICE_SEARCH) && (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "invoice", "invoices.pageTitle")} />
      <InvoiceSearcher rights={rights} />
    </div>
  );

const mapStateToProps = (state) => ({
  rights: !!state.core && !!state.core.user && !!state.core.user.i_user ? state.core.user.i_user.rights : [],
});

export default withModulesManager(
  injectIntl(withTheme(withStyles(defaultPageStyles)(connect(mapStateToProps)(InvoicesPage)))),
);
