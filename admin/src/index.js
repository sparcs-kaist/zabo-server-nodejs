import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router, Route, Switch, Redirect,
} from 'react-router-dom';

import Admin from 'layouts/Admin';
import RTL from 'layouts/RTL';
import SignInSide from './layouts/SignInSide';
import * as serviceWorker from './serviceWorker';

// core components

import 'assets/css/material-dashboard-react.css?v=1.8.0';

ReactDOM.render(
  <Router>
    <Switch>
      <Route path="/auth" component={SignInSide} />
      <Route path="/admin" component={Admin} />
      <Route path="/rtl" component={RTL} />
      <Redirect from="/" to="/admin/dashboard" />
    </Switch>
  </Router>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
