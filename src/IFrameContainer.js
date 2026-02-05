import { useState } from "react";
import styles from "./IFrameContainer.module.css";
import Button from "./components/Button";

function IFrameContainer() {
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [jwtToken, setJwtToken] = useState("");
  const [uiConfig, setUiConfig] = useState("");
  const [uiConfigJSONError, setUIConfigJSONError] = useState(false);
  const [navigateToPath, setNavigateToPath] = useState("");
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
        container: "lowCodeDivContainer",
        ui: configParsed,
        navigation: {
          handler: ({ route }) => {
            console.log("user navigated to " + route);
          },
        },
      })
      .then(() => {
        console.log("iframe rendered");
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

  const checkAndFormatConfig = () => {
    const configObj = (() => {
      try {
        return JSON.parse(uiConfig);
      } catch {
        setUIConfigJSONError(true);
        return null;
      }
    })();
    if (!configObj) return;
    setUIConfigJSONError(false);
    const formattedConfig = JSON.stringify(configObj, null, 2);
    setUiConfig(formattedConfig);
  };

  const runOnce = () => {
    whiteLabelSDK.runOnce();
  };

  const save = () => {
    whiteLabelSDK.save();
  };

  const deploy = () => {
    whiteLabelSDK.deploy();
  };

  const activate = () => {
    whiteLabelSDK.toggleActiveScenarioState();
  };

  const createEmptyScenario = () => {
    whiteLabelSDK.createEmptyScenario("Empty scenario");
  };

  const createWebhookScenario = () => {
    whiteLabelSDK.setScenarioRunningStateChangedListener(
      ({ isScenarioRunning }) => {
        if (isScenarioRunning) {
          addLoader();
        } else {
          removeLoader();
        }
      },
    );
    whiteLabelSDK.createWebhookScenario().then((webhookUrl) => {
      fetch(webhookUrl.dev, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: 123,
          string: "Test string",
        }),
      });
    });
  };

  const getNodeTypes = () => {
    whiteLabelSDK
      .getNodeTypes()
      .then((data) => {
        console.log({ nodeTypes: data });
      })
      .catch((e) => {
        console.error({ e });
      });
  };

  const addNewNode = () => {
    whiteLabelSDK.getNodeTypes().then((nodeTypes) => {
      const webhookNodeType = nodeTypes.find((nt) => nt.alias === "webhook");
      whiteLabelSDK.addNewNode(webhookNodeType?.id, "test node name");
    });
  };

  const getScenarioWebhooksUrls = () => {
    whiteLabelSDK
      .getScenarioWebhooksUrls()
      .then((res) => {
        console.log({ res });
      })
      .catch((e) => {
        console.error({ e });
      });
  };

  const addLoader = () => {
    const parentDiv = document.getElementById("lowCodeDivContainer");

    const existingLoader = document.getElementById("iframe-loader");

    if (parentDiv && !existingLoader) {
      const loader = document.createElement("div");
      loader.id = "iframe-loader";

      Object.assign(loader.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "9999",
        pointerEvents: "all",
      });

      const computedStyle = window.getComputedStyle(parentDiv);
      if (computedStyle.position === "static") {
        parentDiv.style.position = "relative";
      }

      parentDiv.appendChild(loader);
    }
  };

  const removeLoader = () => {
    const loader = document.getElementById("iframe-loader");
    if (loader) loader.remove();
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <Button
          onClick={() => {
            setLeftPanelVisible((prev) => !prev);
          }}
          className={styles.hideLeftPanelBtn}
        >
          {leftPanelVisible ? "<" : ">"}
        </Button>
        <div
          className={styles.leftPanelInner}
          style={{ display: leftPanelVisible ? "block" : "none" }}
        >
          <input
            type="text"
            placeholder="JWT Token"
            value={jwtToken}
            onChange={(e) => setJwtToken(e.target.value)}
          />
          <div className={styles.uiConfigJSONContainer}>
            <textarea
              placeholder="UI Config JSON"
              value={uiConfig}
              onChange={(e) => setUiConfig(e.target.value)}
              className={uiConfigJSONError ? styles.uiConfigError : undefined}
            />
            {uiConfigJSONError && (
              <span className={styles.uiConfigErrorLabel}>Incorrect JSON</span>
            )}
          </div>

          <div className={styles.buttonsContainer}>
            <Button onClick={checkAndFormatConfig}>Check Config JSON</Button>
          </div>
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
          <div style={{ marginTop: 10 }}>SDK Actions</div>
          <div className={styles.actionBtns}>
            <Button onClick={runOnce}>Run Once</Button>
            <Button onClick={save}>Save</Button>
            <Button onClick={deploy}>Deploy</Button>
            <Button onClick={activate}>Activate</Button>
            <Button onClick={createEmptyScenario}>Create Empty Scenario</Button>
            <Button onClick={createWebhookScenario}>
              Create Webhook Scenario
            </Button>
            <Button onClick={getNodeTypes}>Get Node Types</Button>
            <Button onClick={addNewNode}>Add New Node</Button>
            <Button onClick={getScenarioWebhooksUrls}>
              Get Scenario Webhook URL
            </Button>
          </div>
        </div>
      </div>

      <div id="lowCodeDivContainer" className={styles.rightPanel} />
    </div>
  );
}

export default IFrameContainer;
