import clear from 'clear';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { AdminUser, Group, PreRegister, User } from '../../src/db';

/*
  TODO:
   - Seed ZABO
   - Seed User
 */
clear ();

console.log (
  chalk.blueBright (
    figlet.textSync ('SPARCS', { horizontalLayout: 'full', font: 'ghost' }),
  ),
);

const actions = {
  addAdminUser: 'Add Admin User',
  seedPreRegister: 'Seed PreRegistered Groups',
  quit: 'Quit',
};

const actionQuestion = [
  {
    name: 'actionType',
    type: 'list',
    message: 'What do you want to do?',
    choices: Object.values (actions),
    validate: (value) => {
      if (value.length) {
        return true;
      }
      return 'Please enter your username or e-mail address.';
    },
  },
];

const userSelectKeyQuestion = [
  {
    name: 'key',
    type: 'list',
    message: 'Which key do you want to use?',
    choices: [
      'Student ID',
      'Username',
      'Select',
    ],
  },
];

const userSelection = (choices) => [{
  name: 'chosen',
  type: 'list',
  message: 'Which user do you want to select?',
  choices,
}];

const userQuery = [{
  name: 'value',
  type: 'input',
  message: 'Input value',
  validate: (value) => {
    if (value.length) {
      return true;
    }
    return 'Please enter valid input.';
  },
}];

const seedPreRegisters = async () => {
  const prevCount = await PreRegister.countDocuments ();
  const { confirmed } = await inquirer.prompt ({
    type: 'confirm',
    name: 'confirmed',
    message: `
      Seeding pre-registered groups might cause unexpected error.
      ${prevCount} document found in PreRegisters collection.
      Do you really want to proceed?
    `,
    default: false,
  });
  if (!confirmed) {
    console.warn ('Not Confirmed. Aborting..');
    return;
  }
  console.log ('Start of seeding groups...');
  let sids;
  try {
    sids = await import ('../../config/sids.json');
    sids = sids.default;
    console.log ('==>');
    console.log ('==> SIDs found ');
    console.log ('==>');
    console.log (sids);
  } catch (error) {
    console.error ('config/sids.json file not found. Aborting...');
    return;
  }
  const rawGroups = sids.map (({ owner, ownerSID, groupName }) => ({
    name: groupName,
    isPreRegistered: true,
    description: '사전 등록된 그룹입니다.',
    score: 10,
  }));
  const groups = await Group.insertMany (rawGroups);
  console.log ('==>');
  console.log ('==> Groups seeded');
  console.log ('==>');
  console.log (groups);

  const rawPreRegisters = sids.map (({ owner, ownerSID, groupName }, index) => ({
    group: groups[index]._id,
    groupName,
    owner,
    ownerSID,
  }));
  const preRegisters = await PreRegister.insertMany (rawPreRegisters);
  console.log ('==>');
  console.log ('==> PreRegisters seeded');
  console.log ('==>');
  console.log (preRegisters);
  return preRegisters;
};

const addAdminUser = async () => {
  const { key } = await inquirer.prompt (userSelectKeyQuestion);
  let user;
  switch (key) {
    case 'Student ID': {
      const { value: studentId } = await inquirer.prompt (userQuery);
      user = await User.findOne ({ studentId });
      break;
    }
    case 'Username': {
      const { value: username } = await inquirer.prompt (userQuery);
      user = await User.findOne ({ username });
      break;
    }
    case 'Select': {
      const users = await User.find ({ isAdmin: { $ne: true } }).limit (20);
      const choices = users.map (user => `${user.username} ${user.studentId} ${user.koreanName}`);
      const { chosen } = await inquirer.prompt (userSelection ([...choices, 'quit']));
      if (chosen === 'quit') {
        console.warn ('Selected Quit. Aborting..');
        return;
      }
      const index = choices.findIndex (choice => choice === chosen);
      user = users[index];
      break;
    }
    default:
      console.error ('Key error');
  }
  if (!user) {
    console.warn ('User not found. Aborting..');
    return;
  }
  if (user.isAdmin) {
    console.warn (`'${user.username} ${user.studentId} ${user.koreanName}' Is already an admin. Aborting...`);
    return;
  }
  const { confirmed } = await inquirer.prompt ({
    type: 'confirm',
    name: 'confirmed',
    message: `Is '${user.username} ${user.studentId} ${user.koreanName}' correct?`,
    default: false,
  });
  if (!confirmed) {
    console.warn ('Not Confirmed. Aborting..');
    return;
  }

  user.isAdmin = true;
  const [adminUser] = await Promise.all ([
    AdminUser.create ({ user: user._id }),
    user.save (),
  ]);
  console.log ('Registered as Admin User Successfully', adminUser);
};

const run = async () => {
  do {
    const { actionType } = await inquirer.prompt (actionQuestion);
    switch (actionType) {
      case actions.addAdminUser: {
        await addAdminUser ();
        break;
      }
      case actions.seedPreRegister: {
        await seedPreRegisters ();
        break;
      }
      case actions.quit: {
        return;
      }
      default:
        console.error (`Action ${actionType} not found`);
        return;
    }
    console.log ();
  } while (true);
};

run ()
  .then (() => process.exit (0))
  .catch (error => {
    console.error (error);
    console.warn ('==> Process exited with unexpected error');
    console.warn ('==> Exiting process with exit code 1');
    process.exit (1);
  });
