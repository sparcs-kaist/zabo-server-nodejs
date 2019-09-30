import React from 'react';
import PropTypes from 'prop-types';
// react plugin for creating charts
import { Bar, Line } from 'react-chartjs-2';
// @material-ui/core
import { withStyles } from '@material-ui/core/styles';
import {ArrowUpward, ArrowDownward, ArrowForward, OpenInNew} from '@material-ui/icons';
// core components
import GridItem from 'components/Grid/GridItem';
import GridContainer from 'components/Grid/GridContainer';
import Card from 'components/Card/Card';
import CardHeader from 'components/Card/CardHeader';
import CardBody from 'components/Card/CardBody';
import CardFooter from 'components/Card/CardFooter';

import styles from 'assets/jss/material-dashboard-react/views/dashboardStyle';
import { Divider } from '@material-ui/core';

import axios from 'axios';

Date.prototype.withoutTime = function () {
  var d = new Date(this);
  d.setHours(0, 0, 0, 0);
  return d;
}

class Dashboard extends React.Component {
  state = {
    totalZaboCounts: 0,
    todayZaboCounts: 0,
    totalUserCounts: 0,
    todayUserCounts: 0,
    days: [],
    zaboChartData: {
      data: []
    },
    userChartData: {
      data: []
    }
  }

  fetchZaboChartData = () => {
    axios.get('http://localhost:6001/api/admin/analytics/zabo/date/created')
      .then(res => {
        const cnt = [0, 0, 0, 0, 0, 0, 0];       
        res.data.forEach((date) => {
          const pos = new Date();
          const temp = new Date(date);

          for (let i = 0; i < 6; i++) {
            if (temp.getDate() === pos.getDate() && temp.getMonth() === pos.getMonth() && temp.getFullYear() === pos.getFullYear()) {
              cnt[6 - i]++;
              break;
            } else {
              pos.setDate(pos.getDate() - 1);
            }
          }
        });

        this.setState({
          totalZaboCounts: res.data.length,
          todayZaboCounts: cnt[6],
          zaboChartData: {
            labels: this.state.days,
            data: cnt,
          }
        });
      })
      .catch(err => {
        alert(err);
        this.setState({
          totalZaboCounts: 'NaN',
          todayZaboCounts: 'NaN',
          zaboChartData: {
            labels: [''],
            data: [0]
          }
        });
      });
  }

  fetchUserChartData = () => {
    axios.get('http://localhost:6001/api/admin/analytics/user/date/created')
      .then(res => {
        const cnt = [0, 0, 0, 0, 0, 0, 0];       
        res.data.forEach((date) => {
          const pos = new Date();
          const temp = new Date(date);

          for (let i = 0; i < 6; i++) {
            if (temp.getDate() === pos.getDate() && temp.getMonth() === pos.getMonth() && temp.getFullYear() === pos.getFullYear()) {
              cnt[6 - i]++;
              break;
            } else {
              pos.setDate(pos.getDate() - 1);
            }
          }
        });

        this.setState({
          totalUserCounts: res.data.length,
          todayUserCounts: cnt[6],
          userChartData: {
            labels: this.state.days,
            data: cnt,
          }
        });
      })
      .catch(err => {
        alert(err);
        this.setState({
          totalUserCounts: 'NaN',
          todayUserCounts: 'NaN',
          userChartData: {
            labels: [''],
            data: [0]
          }
        });
      });
  }

  componentDidMount() {
    // Set labels
    const today = new Date();
    const days = [];

    for (let i = 0; i < 7; i++) {
      if (i === 6 || today.getDate() === 1) {
        days[6 - i] = today.getMonth() + 1 + '/' + today.getDate();
      } else {
        days[6 - i] = today.getDate();
      }
      today.setDate(today.getDate() - 1);
    }

    this.setState({
      days: days,
    });

    this.fetchZaboChartData();
    this.fetchUserChartData();
  }

  render() {
    const { classes } = this.props;
    return (
      <div>
        <h1 className={classes.containerTitle}>모아보기</h1>
        <GridContainer>
          <GridItem xs={12} sm={12} md={4}>
            <Card chart>
              <CardHeader color="success">
                <Bar 
                  data={{ 
                    labels: this.state.zaboChartData.labels, 
                    datasets: [
                      { 
                        data: this.state.zaboChartData.data, 
                        label: ' Zabos', 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                        borderWidth: 1
                      },
                    ],
                  }}
                  options={{
                    legend: {
                      display: false,
                    },
                    scales: {
                      xAxes: [{
                        maxBarThickness: 15,
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                        }
                      }],
                      yAxes: [{
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          beginAtZero: true,
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                          precision: false,
                        }
                      }]
                    }
                  }}
                />
              </CardHeader>
              <CardBody>
                <h4 className={classes.cardTitle}>등록된 자보 수</h4>
                <p className={classes.cardCategory}>
                  오늘은
                  <>
                    {
                      this.state.zaboChartData.data[6] > this.state.zaboChartData.data[5] ?
                        <span className={classes.cardEmphasizeSuccess}>
                          <ArrowUpward className={classes.arrowCardCategory} />
                          { this.state.todayZaboCounts }
                        </span>
                      : this.state.zaboChartData.data[6] < this.state.zaboChartData.data[5] ?
                        <span className={classes.cardEmphasizeDanger}>
                          <ArrowDownward className={classes.arrowCardCategory} />
                          { this.state.todayZaboCounts }
                        </span>
                      : 
                      <span className={classes.cardEmphasizeNormal}>
                        <ArrowForward className={classes.arrowCardCategory} />
                        { this.state.todayZaboCounts }
                      </span>
                    }
                  </>
                  개, 총
                  {
                    this.state.zaboChartData.data[6] > this.state.zaboChartData.data[5] ?
                      <span className={classes.cardEmphasizeSuccess}>
                        { this.state.totalZaboCounts }
                      </span>
                    : this.state.zaboChartData.data[6] < this.state.zaboChartData.data[5] ?
                      <span className={classes.cardEmphasizeDanger}>
                        { this.state.totalZaboCounts }
                      </span>
                    : 
                    <span className={classes.cardEmphasizeNormal}>
                      { this.state.totalZaboCounts }
                    </span>
                    }
                  개의 자보가 등록되었습니다.
                </p>
              </CardBody>
              <CardFooter chart style={{ justifyContent: 'flex-end' }}>
                <div className={classes.stats}>
                  <OpenInNew /> 자세히 보기
                </div>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card chart>
              <CardHeader color="warning">
                <Bar 
                  data={{ 
                    labels: this.state.userChartData.labels, 
                    datasets: [
                      { 
                        data: this.state.userChartData.data, 
                        label: ' Users', 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                        borderWidth: 1
                      },
                    ],
                  }}
                  options={{
                    legend: {
                      display: false,
                    },
                    scales: {
                      xAxes: [{
                        maxBarThickness: 15,
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                        }
                      }],
                      yAxes: [{
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          beginAtZero: true,
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                          precision: false,
                        }
                      }]
                    }
                  }}
                />
              </CardHeader>
              <CardBody>
                <h4 className={classes.cardTitle}>회원 수</h4>
                <p className={classes.cardCategory}> 
                  오늘은
                  <>
                    {
                      this.state.userChartData.data[6] > this.state.userChartData.data[5] ?
                        <span className={classes.cardEmphasizeSuccess}>
                          <ArrowUpward className={classes.arrowCardCategory} />
                          { this.state.todayUserCounts }
                        </span>
                      : this.state.userChartData.data[6] < this.state.userChartData.data[5] ?
                        <span className={classes.cardEmphasizeDanger}>
                          <ArrowDownward className={classes.arrowCardCategory} />
                          { this.state.todayUserCounts }
                        </span>
                      : 
                      <span className={classes.cardEmphasizeNormal}>
                        <ArrowForward className={classes.arrowCardCategory} />
                        { this.state.todayUserCounts }
                      </span>
                    }
                  </>
                  명, 총
                  {
                    this.state.userChartData.data[6] > this.state.userChartData.data[5] ?
                      <span className={classes.cardEmphasizeSuccess}>
                        { this.state.totalUserCounts }
                      </span>
                    : this.state.userChartData.data[6] < this.state.userChartData.data[5] ?
                      <span className={classes.cardEmphasizeDanger}>
                        { this.state.totalUserCounts }
                      </span>
                    : 
                    <span className={classes.cardEmphasizeNormal}>
                      { this.state.totalUserCounts }
                    </span>
                    }
                  명의 회원이 가입했습니다.
                </p>
              </CardBody>
              <CardFooter chart style={{ justifyContent: 'flex-end' }}>
                <div className={classes.stats}>
                  <OpenInNew /> 자세히 보기
                </div>
              </CardFooter>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={4}>
            <Card chart>
              <CardHeader color="danger">
                <Line
                  data={{ 
                    labels: this.state.userChartData.labels, 
                    datasets: [
                      { 
                        data: this.state.userChartData.data, 
                        label: ' CCU', 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                        borderColor: 'rgba(255, 255, 255, 0.7)',
                        borderWidth: 1,
                        fill: false,
                        borderWidth: 3.1,
                      },
                    ],
                  }}
                  options={{
                    legend: {
                      display: false,
                    },
                    scales: {
                      xAxes: [{
                        maxBarThickness: 15,
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                        }
                      }],
                      yAxes: [{
                        gridLines: {
                          color: 'rgba(255, 255, 255, 0.2)',
                          zeroLineColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        ticks: {
                          beginAtZero: true,
                          fontColor: 'rgba(255, 255, 255, 0.9)',
                          precision: false,
                        }
                      }]
                    }
                  }}
                />
              </CardHeader>
              <CardBody>
                <h4 className={classes.cardTitle}>실시간 사용자 수</h4>
                <p className={classes.cardCategory}>현재 총 
                  <span className={classes.cardEmphasizeSuccess}>
                    1135
                  </span>
                  (비회원
                  <span className={classes.cardEmphasizeNormal}>
                    123551
                  </span>)명이 자보를 이용중입니다.
                </p>            
              </CardBody>
              <CardFooter chart style={{ justifyContent: 'flex-end' }}>
                <div className={classes.stats}>
                  <OpenInNew /> 자세히 보기
                </div>
              </CardFooter>
            </Card>
          </GridItem>
        </GridContainer>
        <Divider />
      </div>
    );
  }
}

Dashboard.propTypes = {
  classes: PropTypes.object.isRequired,
}

export default withStyles(styles)(Dashboard);