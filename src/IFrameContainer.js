import React, { useState } from 'react';
import styles from './IFrameContainer.module.css';
import Button from './components/Button';

function IFrameContainer() {
  const [jwtToken, setJwtToken] = useState('');
  const [uiConfig, setUiConfig] = useState('');
  const [navigateToPath, setNavigateToPath] = useState('');
  const [whiteLabelSDK] = useState(() => new window.LatenodeEmbeddedSDK());

  const configParsed = (() => {
    try {
      return JSON.parse(uiConfig);
    } catch (e) {
      return {
        scenarios: {
          hideEmptyScenariosGreetings: true,
          hideExploreAppsButton: true,
        },
        main: {
          hideSideMenu: true,
        },
      };
    }
  })();

  const handleInit = () => {
    whiteLabelSDK.cleanup();
    whiteLabelSDK
      .configure({
        token: jwtToken,
        container: 'lowCodeDivContainer',
        ui: configParsed,
        navigation: {
          handler: ({ route }) => {
            console.log('user navigated to ' + route);
          },
        },
      })
      .then(() => {
        console.log('iframe rendered');
      });
  };

  const handleUpdate = () => {
    console.log(configParsed);
    whiteLabelSDK.update(configParsed);
  };

  const handleNavigate = () => {
    if (navigateToPath) {
      whiteLabelSDK.navigate({ to: navigateToPath });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <input
          type="text"
          placeholder="JWT Token"
          value={jwtToken}
          onChange={(e) => setJwtToken(e.target.value)}
        />
        <textarea
          placeholder="UI Config JSON"
          value={uiConfig}
          onChange={(e) => setUiConfig(e.target.value)}
        />
        <div className={styles.buttonsContainer}>
          <Button onClick={handleInit}>Init</Button>
          <Button onClick={handleUpdate}>Update</Button>
        </div>
        <input
          type="text"
          placeholder="Navigate To"
          value={navigateToPath}
          onChange={(e) => setNavigateToPath(e.target.value)}
        />
        <Button onClick={handleNavigate}>Navigate</Button>
      </div>
      <div id="lowCodeDivContainer" className={styles.rightPanel} />
    </div>
  );
}

export default IFrameContainer;