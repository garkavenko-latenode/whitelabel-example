import React, { useState } from 'react';
import IFrameContainer from "./IFrameContainer";
import styles from './App.module.css'; 
import JWTGeneration from './JWTGenaration';

function App() {
  const [activeTab, setActiveTab] = useState('whiteLabel'); 

  return (
    <div className={styles.appContainer}>
      <div className={styles.header}> 
        <div className={styles.tabContainer}> 
          <button 
            className={`${styles.tab} ${activeTab === 'whiteLabel' ? styles.activeTab : ''}`} 
            onClick={() => setActiveTab('whiteLabel')}
          >
            White Label
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'jwtGeneration' ? styles.activeTab : ''}`} 
            onClick={() => setActiveTab('jwtGeneration')}
          >
            JWT Generation
          </button>
        </div>
        <h1 className={styles.title}>White Label</h1>
      </div>
      <div className={styles.tabContent}>
        <div className={activeTab === 'whiteLabel' ? styles.active : styles.hidden}>
          <IFrameContainer />
        </div>
        <div className={activeTab === 'jwtGeneration' ? styles.active : styles.hidden}>
          <JWTGeneration />
        </div>
      </div>
    </div>
  );
}

export default App;