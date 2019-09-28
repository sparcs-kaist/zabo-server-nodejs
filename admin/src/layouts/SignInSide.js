import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import SSOLogo from 'assets/img/Projects-SSO.svg';

function Copyright(props) {
  return (
    <Typography variant="body2" color="textSecondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://sparcs.org/">
        SPARCS
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    height: '100vh',
  },
  '@keyframes slide': {
    from: { backgroundPositionX: '0%', backgroundPositionY: '0%' },
    to: { backgroundPositionX: '100%', backgroundPositionY: '100%' },
  },
  '@keyframes fadeDown': {
    '0%': { opacity: 0, top: '-30px' },
    '100%': { opacity: 1, top: '0' },
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    animation: '$slide',
    animationDuration: '80s',
    // transition: theme.transitions.create(
    //   ['border-color', 'color', 'opacity'],
    //   { duration: theme.transitions.duration.complex }
    // ),
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  fadeDown: {
    opacity: 0,
    animation: '$fadeDown',
    animationDuration: '1s',
    animationFillMode: 'forwards',
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  buttonSubmit: {
  },
  buttonSSO: {
    backgroundColor: '#75589B',
    marginTop: theme.spacing(1),
  },
  sso: {
    height: '24px',
    marginRight: '10px',
  }
}));

export default function SignInSide() {
  const classes = useStyles();

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7} className={classes.image} />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <Avatar
            className={[classes.avatar, classes.fadeDown]}
            style={{ animationDelay: '.1s' }}
          >
            <LockOutlinedIcon />
          </Avatar>
          <div
            className={classes.fadeDown}
            style={{ animationDelay: '.1s' }}
          >
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
          </div>
          <form className={classes.form} noValidate>
            <TextField
              className={classes.fadeDown}
              style={{ animationDelay: '.5s' }}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
            />
            <TextField
              className={classes.fadeDown}
              style={{ animationDelay: '1s' }}
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
            />
            {/* <FormControlLabel */}
            {/*  className={classes.fadeDown} */}
            {/*  style={{ animationDelay: '1.5s' }} */}
            {/*  control={<Checkbox value="remember" color="primary" />} */}
            {/*  label="Remember me" */}
            {/* /> */}
            <Grid className={classes.submit}>
              <Button
                className={[classes.buttonSubmit, classes.fadeDown]}
                style={{ animationDelay: '1.5s' }}
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
              >
                Sign In
              </Button>
              <Button
                className={[classes.buttonSSO, classes.fadeDown]}
                style={{ animationDelay: '2s' }}
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
              >
                <img src={SSOLogo} className={classes.sso} />SPARCS SSO로 로그인하기
              </Button>
            </Grid>
            {/* <Grid */}
            {/*  container */}
            {/*  className={classes.fadeDown} */}
            {/*  style={{ animationDelay: '2.5s' }} */}
            {/* > */}
            {/*  <Grid item xs> */}
            {/*    <Link href="#" variant="body2"> */}
            {/*      Forgot password? */}
            {/*    </Link> */}
            {/*  </Grid> */}
            {/*  <Grid item> */}
            {/*    <Link href="#" variant="body2"> */}
            {/*      {"Don't have an account? Sign Up"} */}
            {/*    </Link> */}
            {/*  </Grid> */}
            {/* </Grid> */}
            <Box mt={5}>
              <Copyright
                className={classes.fadeDown}
                style={{ animationDelay: '2.5s' }}
              />
            </Box>
          </form>
        </div>
      </Grid>
    </Grid>
  );
}
