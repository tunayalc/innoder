// Explicit simulator entry for store screenshots. Never use for distribution.
const React = require('react');
const { AppRegistry, Text } = require('react-native');
const { appConfig } = require('../../src/config/appConfig');
appConfig.dataSource = 'mock';

const App = require('../../App').default;
const { name } = require('../../app.json');
const { store } = require('../../src/store');
const { loginCandidate } = require('../../src/store/thunks/authThunks');
const { MOCK_STORAGE_KEYS, writeJson } = require('../../src/services/backend/mock/mockStorage');
const { createSeedApplications, createSeedMessages, createSeedUsers } = require('../../src/services/seedData');

const email = 'aday@inno.example';
const password = 'ScreenshotSample01';

async function preparePreview() {
  const candidate = createSeedUsers().find(user => user.id === 'user-aylin');
  const application = createSeedApplications().find(item => item.userId === candidate.id);
  const programName = 'Avrupa Dayanışma Programı';

  await Promise.all([
    writeJson(MOCK_STORAGE_KEYS.users, [{ ...candidate, email }]),
    writeJson(MOCK_STORAGE_KEYS.passwords, { [candidate.id]: password }),
    writeJson(MOCK_STORAGE_KEYS.applications, [
      {
        ...application,
        programName,
        program: { ...application.program, name: programName },
        personalInfo: { ...application.personalInfo, identityNumber: undefined },
      },
    ]),
    writeJson(MOCK_STORAGE_KEYS.messages, createSeedMessages()),
  ]);
  await store.dispatch(loginCandidate({ email, password }));
  if (!store.getState().user.user) throw new Error('Preview login failed');
}

function Preview() {
  const [status, setStatus] = React.useState('loading');
  React.useEffect(() => {
    preparePreview().then(() => setStatus('ready'), () => setStatus('error'));
  }, []);
  if (status === 'error') return React.createElement(Text, null, 'Preview setup failed');
  return status === 'ready' ? React.createElement(App) : null;
}

AppRegistry.registerComponent(name, () => Preview);
