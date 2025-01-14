// -*- mode: js-jsx -*-
/* Bazecor -- Kaleidoscope Command Center
 * Copyright (C) 2018, 2019  Keyboardio, Inc.
 * Copyright (C) 2019, 2020  DygmaLab SE
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import Electron from "electron";
import path from "path";
import fs from "fs";
import { version, fwVersion } from "../../../package.json";
import escimg from "../../../static/press_esc.png";

import Focus from "../../api/focus";
import FlashRaise from "../../api/flash";
import Backup from "../../api/backup";

import Styled from "styled-components";
import { toast } from "react-toastify";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Dropdown from "react-bootstrap/Dropdown";
import ProgressBar from "react-bootstrap/ProgressBar";
import {
  MdSettingsBackupRestore,
  MdExplore,
  MdInfo,
  MdBuild,
  MdArrowDropDown
} from "react-icons/md";

import { getStaticPath } from "../config";
import i18n from "../i18n";

// const ModalStyle = Styled.div`
// background-color: ${({ theme }) => theme.card.background};
// color: ${({ theme }) => theme.colors.text};
// padding: 24px;
// overflow: hidden;
// box-shadow: 0px 1px 3px 0px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 2px 1px -1px rgb(0 0 0 / 12%);
// border-radius: 4px;
// .flash-modal {
//   max-width: 900px !important;
// }
// `;

const Styles = Styled.div`
.firmware-update {
  .firmware-row {
    justify-content: center;
    align-items: center;
    display: flex;
    padding-top: 15vh;
    .firmware-col {
      min-width: 500px;
      max-width: 500px;
      .firmware-card {
        background: ${({ theme }) => theme.card.background};
        .header{
          font-size: 2em;
          font-weight: 200;
          padding: 1rem;
          margin: -24px;
          text-align: center;
        }
        .body {
          margin-top: 1.5rem;
          padding 0;
          padding-top: 1.25rem;
          padding-bottom: 1.25rem;
          .flashingcol {
            text-align: center;
            .custombutton{
              float: left;
            }
          }
        }
        .title {
          text-align: center;
        }
        .subtitle {
          color: ${({ theme }) => theme.colors.text};
          text-align: center;
        }
        .loader {
          align-self: center;
          .spinner-border {
            width: 4rem;
            height: 4rem;
        }
      }
      .version {
        margin: 2rem;
        padding-top: 12px;
        padding-bottom: 12px;
        .white {
          color: white;
        }
        .body {
          padding: 0;
          margin: 0;
        }
        .title {
          font-weight: 200;
          font-size: 1.4rem;
        }
        .text {
          font-size: 2em;
          font-weight: 500;
          text-align: center;
        }
      }
      .preview {
        justify-content: center;
        align-items: center;
        display: flex;
        padding: 0px;

        .keyboard {
          justify-content: center;
          align-items: center;
          display: flex;
          svg {
            width: 80%;
            margin-bottom: 10px;
          }
        }
        .options {
          text-align: center;
          .selector {
            width: 100%;
            .dropdown-toggle::after{
              position: absolute;
              right: 10px;
              top: 30px;
            }
            .toggler {
              width: 100%;
              background-color: transparent;
              color: ${({ theme }) => theme.colors.button.text};
              border: 0;
              border-bottom: black 1px solid;
              border-radius: 0px;
              padding-bottom: 6px;
              :hover {
                background-color: transparent;
              }
            }
            .toggler:hover {
              border-bottom: black 2px solid;
              padding-bottom: 5px;
            }
            .toggler:focus {
              border-bottom: rgba($color: red, $alpha: 0.8) 2px solid;
              box-shadow: none;
            }
            .menu {
              width: inherit;
              justify-content: center;
              align-items: center;
              text-align: center;
            }
            .key-icon {
              background-color: ${({ theme }) =>
                theme.colors.button.background} !important;
              border-radius: 100%;
              padding: 0;
              max-width: 50px;
              height: 50px;
              svg {
                font-size: 2.1em;
                margin-top: 18%;
                width: 100%;
                color: ${({ theme }) => theme.colors.button.text};
              }
            }
            .key-text {
              span {
                width: 100%;
              }
            }
            .muted {
              color: rgba(140,140,140,0.8) !important;
            }
            a:hover {
              background-color: ${({ theme }) =>
                theme.colors.button.hover} !important;
            }
            .dropdown-item {
              display: inherit;
            }
          }
          .selector-error {
            color: red;
          }
        }
      }
    }
      .buttons {
        padding: 0px;
        button {
          width: 100%;
        }
        }
    }
  }
}
.flashingbutton {
  float: right;
}
.centersection {
  text-align: center;
}
.outlined {
  background-color: transparent;
  border: 2px solid ${({ theme }) => theme.colors.button.secondary};
  color: ${({ theme }) => theme.colors.button.secondary};
}
.arrowicon {
  font-size: 1.6em;
}
.nooutlined {
  border: 2px solid ${({ theme }) => theme.colors.button.background};
}
.thintext {
  font-size: 1.2em;
  font-weight: 100;
}
.progressbar {
  text-align: center;
}
`;

class FirmwareUpdate extends React.Component {
  constructor(props) {
    super(props);

    let focus = new Focus();
    this.flashRaise = null;
    this.isDevelopment = process.env.NODE_ENV !== "production";
    this.bkp = new Backup();

    this.state = {
      advanced: false,
      firmwareFilename: "",
      selected: "default",
      device: props.device || focus.device,
      confirmationOpen: false,
      countdown: -1,
      firmwareDropdown: false,
      buttonText: [
        i18n.firmwareUpdate.milestones.backup,
        i18n.firmwareUpdate.milestones.esc,
        i18n.firmwareUpdate.milestones.flash,
        i18n.firmwareUpdate.milestones.restore
      ],
      versions: null,
      commands: [],
      backup: [],
      backupDone: false,
      flashProgress: 0
    };
  }

  _handleKeyDown = event => {
    switch (event.keyCode) {
      case 27:
        console.log("esc key logged");
        if (this.state.backupDone && this.state.countdown == 1) {
          // TODO: launch flashing procedure
          console.log("launching the flashing procedure");
          this.setState({ countdown: 2, flashProgress: 10 });
          this.upload();
        }
        break;
      default:
        break;
    }
  };

  async componentDidUpdate() {
    // console.log(
    //   "Testing State Update",
    //   this.state.backup.length,
    //   this.state.commands.length,
    //   !this.state.backupDone &&
    //     this.state.backup.length == this.state.commands.length &&
    //     this.state.commands.length > 0
    // );
    if (
      !this.state.backupDone &&
      this.state.backup.length == this.state.commands.length &&
      this.state.commands.length > 0
    ) {
      this.setState({ backupDone: true, countdown: 1 });
      await this.bkp.SaveBackup(this.state.backup);
      await this.putEscKey(this.state.backup[0]);
    }
  }

  async componentDidMount() {
    let focus = new Focus();
    document.addEventListener("keydown", this._handleKeyDown);
    let versions;

    focus.command("version").then(v => {
      if (!v) return;
      let parts = v.split(" ");
      versions = {
        bazecor: parts[0],
        kaleidoscope: parts[1],
        firmware: parts[2]
      };

      this.setState({ versions: versions });
    });
    const commands = await this.bkp.Commands();
    this.setState({ commands });
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this._handleKeyDown);
  }

  async putEscKey(command) {
    let focus = new Focus();
    let withEsc = command.data.split(/\s+/);
    withEsc[0] = 41;
    await focus.command("keymap.custom", withEsc.join(" "));
    await focus.command("layer.moveTo 0");
  }

  selectFirmware = event => {
    if (this.state.firmwareFilename != "") {
      this.setState({ firmwareFilename: "" });
      return;
    }

    let files = Electron.remote.dialog.showOpenDialog({
      title: i18n.firmwareUpdate.dialog.selectFirmware,
      filters: [
        {
          name: i18n.firmwareUpdate.dialog.firmwareFiles,
          extensions: ["hex"]
        },
        {
          name: i18n.firmwareUpdate.dialog.allFiles,
          extensions: ["*"]
        }
      ]
    });
    files.then(result => {
      let aux = result.filePaths[0] != undefined ? result.filePaths[0] : "";
      this.setState({ firmwareFilename: aux, selected: "custom" });
    });
  };

  _defaultFirmwareFilename = () => {
    const { vendor, product } = this.state.device.device.info;
    const cVendor = vendor.replace("/", ""),
      cProduct = product.replace("/", "");
    return path.join(getStaticPath(), cVendor, cProduct, "default.hex");
  };
  _experimentalFirmwareFilename = () => {
    const { vendor, product } = this.state.device.device.info;
    const cVendor = vendor.replace("/", ""),
      cProduct = product.replace("/", "");
    return path.join(getStaticPath(), cVendor, cProduct, "experimental.hex");
  };

  _flash = async () => {
    let focus = new Focus();
    let filename;
    if (this.state.selected == "default") {
      filename = this._defaultFirmwareFilename();
    } else if (this.state.selected == "experimental") {
      filename = this._experimentalFirmwareFilename();
    } else {
      filename = this.state.firmwareFilename;
    }
    if (this.state.device.device.info.product === "Raise") {
      if (!focus.device.bootloader) {
        await this.flashRaise.resetKeyboard(focus._port, this.state.backup);
      }
    }

    try {
      if (focus.device.bootloader) {
        this.flashRaise.currentPort = this.props.device;
      }
      await focus.close();
      console.log("done closing focus");
      return await this.state.device.device.flash(
        focus._port,
        filename,
        this.flashRaise
      );
    } catch (e) {
      console.error(e);
    }
  };

  upload = async () => {
    await this.props.toggleFlashing();

    try {
      await this._flash();
      this.setState({ countdown: 3, flashProgress: 90 });
      await this.flashRaise.restoreSettings();
      this.setState({ countdown: 4, flashProgress: 100 });
    } catch (e) {
      console.error(e);
      const styles = {
        toastText: {
          fontSize: "1rem"
        },
        toastSubText: {
          fontSize: "0.9rem",
          fontStyle: "italic",
          fontWeight: 200,
          color: "#DDD"
        },
        toastButton1: {
          marginRight: "16px"
        },
        toastButton2: {
          marginLeft: "16px",
          float: "right"
        }
      };
      const action = ({ closeToast }) => (
        <Container container spacing={1}>
          <Row container item xs={12}>
            <p style={styles.toastText}>{i18n.firmwareUpdate.flashing.error}</p>
          </Row>
          <Row container item xs={12}>
            <p style={styles.toastSubText}>{e.message}</p>
          </Row>
          <Row container item xs={12}>
            <Col item xs={6}>
              <Button
                variant="contained"
                style={styles.toastButton1}
                onClick={() => {
                  const shell = Electron.remote && Electron.remote.shell;
                  shell.openExternal(
                    "https://support.dygma.com/hc/en-us/articles/360017056397"
                  );
                }}
              >
                Troubleshooting
              </Button>
            </Col>
            <Col item xs={6}>
              <Button onClick={closeToast} style={styles.toastButton2}>
                Dismiss
              </Button>
            </Col>
          </Row>
        </Container>
      );
      toast.error(action);
      this.props.toggleFlashing();
      this.props.onDisconnect();
      this.setState({ confirmationOpen: false });
      return;
    }

    return new Promise(async resolve => {
      let focus = new Focus();
      if (this.state.versions) await focus.command("led.mode 0");
      // setTimeout(() => {
      toast.success(i18n.firmwareUpdate.flashing.success);
      this.props.toggleFlashing();
      this.props.onDisconnect();
      this.setState({ confirmationOpen: false });
      resolve();
      // }, 1000);
    });
  };

  uploadRaise = async () => {
    let focus = new Focus();
    if (this.state.versions) await focus.command("led.mode 1");
    // this.setState({
    //   confirmationOpen: true,
    //   isBeginUpdate: true
    // });
    try {
      this.flashRaise = new FlashRaise(this.props.device);
      // if (!focus.device.bootloader) {
      //   await this.flashRaise.backupSettings();
      // }
      if (this.state.versions)
        this.setState({ countdown: 0, backupDone: false, backup: [] });
      else {
        this.setState({ countdown: 2, flashProgress: 10 });
        this.upload();
      }
    } catch (e) {
      console.error(e);
      const styles = {
        toastText: {
          fontSize: "1rem"
        },
        toastSubText: {
          fontSize: "0.9rem",
          fontStyle: "italic",
          fontWeight: 200,
          color: "#DDD"
        },
        toastButton1: {
          marginRight: "16px"
        },
        toastButton2: {
          marginLeft: "16px",
          float: "right"
        }
      };
      const action = ({ closeToast }) => (
        <Row container spacing={1}>
          <Row container item xs={12}>
            <p style={styles.toastText}>{i18n.firmwareUpdate.flashing.error}</p>
          </Row>
          <Row container item xs={12}>
            <p style={styles.toastSubText}>{e.message}</p>
          </Row>
          <Row container item xs={12}>
            <Col item xs={6}>
              <Button
                variant="contained"
                style={styles.toastButton1}
                onClick={() => {
                  const shell = Electron.remote && Electron.remote.shell;
                  shell.openExternal(
                    "https://support.dygma.com/hc/en-us/articles/360007272638"
                  );
                }}
              >
                Troubleshooting
              </Button>
            </Col>
            <Col item xs={6}>
              <Button onClick={closeToast} style={styles.toastButton2}>
                Dismiss
              </Button>
            </Col>
          </Row>
        </Row>
      );
      toast.error(action);
      this.setState({ confirmationOpen: false });
    }
  };

  cancelDialog = async () => {
    let focus = new Focus();
    this.setState({ countdown: -1 });
    if (this.state.versions) await focus.command("led.mode 0");
  };

  backup = async () => {
    let backup = await this.bkp.DoBackup(this.state.commands);
    this.setState({ backup });
  };

  toggleAdvanced = () => {
    this.setState({ advanced: !this.state.advanced });
  };

  render() {
    const {
      firmwareFilename,
      buttonText,
      countdown,
      isBeginUpdate,
      versions,
      firmwareDropdown,
      flashProgress
    } = this.state;

    let filename = null;
    if (firmwareFilename) {
      filename = firmwareFilename.split(/[\\/]/);
      filename = filename[filename.length - 1];
    }

    // const defaultFirmwareItemText = i18n.formatString(
    //   i18n.firmwareUpdate.defaultFirmware,
    //   version
    // );
    // const defaultFirmwareItem = (
    //   <Dropdown.Item
    //     value="default"
    //     selected={this.state.selected == "default"}
    //   >
    //     <MdSettingsBackupRestore />
    //     <Dropdown.ItemText
    //       primary={defaultFirmwareItemText}
    //       secondary={i18n.firmwareUpdate.defaultFirmwareDescription}
    //     />
    //   </Dropdown.Item>
    // );
    // let hasDefaultFirmware = true;
    // try {
    //   fs.accessSync(this._defaultFirmwareFilename(), fs.constants.R_OK);
    // } catch (_) {
    //   hasDefaultFirmware = false;
    // }

    // const experimentalFirmwareItemText = i18n.formatString(
    //   i18n.firmwareUpdate.experimentalFirmware,
    //   version
    // );
    // const experimentalFirmwareItem = (
    //   <Dropdown.Item
    //     value="experimental"
    //     selected={this.state.selected == "experimental"}
    //   >
    //     <MdExplore />
    //     <Dropdown.ItemText
    //       primary={experimentalFirmwareItemText}
    //       secondary={i18n.firmwareUpdate.experimentalFirmwareDescription}
    //     />
    //   </Dropdown.Item>
    // );
    // let hasExperimentalFirmware = true;

    // try {
    //   fs.accessSync(this._experimentalFirmwareFilename(), fs.constants.R_OK);
    // } catch (_) {
    //   hasExperimentalFirmware = false;
    // }

    // const firmwareSelect = (
    //   <Dropdown
    //     className="selector"
    //     show={firmwareDropdown}
    //     onClick={() =>
    //       this.setState(state => {
    //         return { firmwareDropdown: !state.firmwareDropdown };
    //       })
    //     }
    //   >
    //     <Dropdown.Toggle className="toggler">Select</Dropdown.Toggle>
    //     <Dropdown.Menu className="menu">
    //       {hasDefaultFirmware && defaultFirmwareItem}
    //       {hasExperimentalFirmware && experimentalFirmwareItem}
    //       <Dropdown.Item
    //         selected={this.state.selected == "custom"}
    //         value="custom"
    //       >
    //         <MdBuild />
    //         <Dropdown.ItemText
    //           primary={i18n.firmwareUpdate.custom}
    //           secondary={filename}
    //         />
    //       </Dropdown.Item>
    //     </Dropdown.Menu>
    //   </Dropdown>
    // );

    // let dialogChildren;
    // if (versions) {
    //   dialogChildren = (
    //     <div>
    //       <Card.Title className={"classes.cardSub"}>
    //         {
    //           "During the update, the Neuron will pulse a blue pattern followed by a flash of multiple colors for a few seconds."
    //         }
    //       </Card.Title>
    //       <h6>{"Follow these steps to update your firmware:"}</h6>
    //       <Card.Body>
    //         <ol style={{ lineHeight: "2rem" }}>
    //           <li>
    //             {
    //               "Make sure to have at least one backup of your layers, just in case!"
    //             }
    //           </li>
    //           <li>{"Click 'Start Countdown'."}</li>
    //           <li>
    //             {
    //               "When the countdown reaches zero and the keyboard's lights turn off, press repeatedly or hold the key on the "
    //             }
    //             <a
    //               href="https://support.dygma.com/hc/en-us/articles/360017056397"
    //               color={this.props.darkMode === true ? "primary" : "secondary"}
    //             >
    //               {"top left corner of your Raise"}
    //             </a>
    //             {" (usually the Esc key). Do this for 5-7 seconds."}
    //           </li>
    //           <li>
    //             {
    //               "'Firmware flashed successfully!' will appear on Bazecor's screen."
    //             }
    //           </li>
    //         </ol>
    //       </Card.Body>
    //       <div className={"classes.cardSnack"}>
    //         <div>
    //           <div style={{ display: "flex" }}>
    //             <div>
    //               <MdInfo />
    //             </div>
    //             <div>
    //               {
    //                 "Not following the steps can cause the firmware update process to fail. This won't damage your Raise, but will require you to repeat the process. More information "
    //               }
    //               <a
    //                 href="https://support.dygma.com/hc/en-us/articles/360007272638"
    //                 color={
    //                   this.props.darkMode === true ? "primary" : "secondary"
    //                 }
    //               >
    //                 {"here"}
    //               </a>
    //               {"."}
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // } else {
    //   dialogChildren = (
    //     <React.Fragment>
    //       <div className={"classes.paper"}>
    //         <h5 style={{ fontWeight: "500", paddingBottom: "1rem" }}>
    //           {"Firmware Update Process via Bootloader Mode"}
    //         </h5>
    //         <p className={"classes.cardSub"}>
    //           {
    //             "Click Start Countdown to start the update. The Neuron will flash in multiple colors for a few seconds."
    //           }
    //         </p>
    //         <p className={"classes.cardSub"}>
    //           {
    //             "After the update, you will see the message: 'Firmware flashed successfully!'"
    //           }
    //         </p>
    //         <p className={"classes.cardSub"}>
    //           {
    //             "Your keyboard lights will remain off and the layout will be reverted to its original settings."
    //           }
    //         </p>
    //         <br />
    //         <br />
    //         <div className={"classes.cardSnack"}>
    //           <div>
    //             <div style={{ display: "flex" }}>
    //               <div>
    //                 <MdInfo />
    //               </div>
    //               <div>
    //                 {
    //                   "In case the Firmware Update fails, this won't damage your Raise. Repeat the process or do it in "
    //                 }
    //                 <a
    //                   href="https://support.dygma.com/hc/en-us/articles/360014074997"
    //                   color={
    //                     this.props.darkMode === true ? "primary" : "secondary"
    //                   }
    //                 >
    //                   {"another way"}
    //                 </a>
    //                 {"."}
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </React.Fragment>
    //   );
    // }

    let latestAvailable = (
      <h5 className="title thintext">{`Latest available version is v${fwVersion}`}</h5>
    );

    let currentlyRunning;
    if (versions) {
      currentlyRunning = (
        <React.Fragment>
          <Card
            bg={versions.bazecor != `v${fwVersion}` ? "warning" : "success"}
            className="version"
          >
            <Card.Body
              className={
                versions.bazecor != `v${fwVersion}` ? "body" : "white body"
              }
            >
              <Card.Title className="title">
                {"Your Raise's firmware version is"}
              </Card.Title>
              <Card.Text className="text">{versions.bazecor}</Card.Text>
            </Card.Body>
          </Card>
        </React.Fragment>
      );
    }
    const progress = (
      <Card className="firmware-card">
        <Card.Header className="header">
          {versions
            ? "Raise Firmware Update"
            : "Firmware Update Process via Bootloader Mode"}
        </Card.Header>

        {countdown > 1 ? (
          <Card.Body className="progressbar my-5">
            <h2>
              {this.state.versions
                ? countdown > 2
                  ? "Release the key"
                  : "Hold the key"
                : "Flashing!"}
            </h2>
            <ProgressBar className="mt-5 mb-2">
              <ProgressBar animate striped now={flashProgress} />
            </ProgressBar>
            <h4>{"Updating the firmware ..."}</h4>
          </Card.Body>
        ) : (
          <React.Fragment>
            <Card.Body className="body d-flex flex-column justify-content-center">
              <Card.Title>
                {
                  "Press and hold the top left key to start the firmware update."
                }
              </Card.Title>
              <Card.Title>
                {"Don't release the key until the process finishes."}
              </Card.Title>
            </Card.Body>
            <Card.Img variant="bottom" src={escimg} />
            <Row className="mt-auto">
              <Col className="flashingcol">
                <Button
                  className="custombutton outlined "
                  size="lg"
                  onClick={this.cancelDialog}
                >
                  {i18n.firmwareUpdate.texts.cancel}
                </Button>
              </Col>
            </Row>
          </React.Fragment>
        )}
      </Card>
    );

    const flashCard = (
      <Card className="firmware-card">
        <Card.Header className="header">
          {versions
            ? "Raise Firmware Update"
            : "Firmware Update Process via Bootloader Mode"}
        </Card.Header>
        <Card.Body className="body d-flex flex-column justify-content-center">
          <Card.Title>
            {"Press and hold the top left key to start the firmware update."}
          </Card.Title>
          <Card.Title>
            {"Don't release the key until the process finishes."}
          </Card.Title>
        </Card.Body>
        <Card.Img variant="bottom" src={escimg} />
        <Row className="mt-auto">
          <Col className="flashingcol">
            <Button
              className="custombutton outlined "
              size="lg"
              onClick={this.cancelDialog}
            >
              {i18n.firmwareUpdate.texts.cancel}
            </Button>
          </Col>
        </Row>
      </Card>
    );

    const disclaimerCard = (
      <Card className="firmware-card">
        <Card.Header className="header">
          {versions
            ? "Raise Firmware Update"
            : "Firmware Update Process via Bootloader Mode"}
        </Card.Header>
        <Card.Body className="body d-flex flex-column">
          <p className="thintext">
            {
              "During the update, the Neuron will pulse a blue pattern followed by a flash of multiple colors for a few seconds."
            }
          </p>
          <p className="thintext">
            {
              "If the firmware update process isn't successful, don't worry. It won't damage your Raise, but you will need to repeat the process."
            }
          </p>
          <p className="thintext">
            {
              "Click Next to backup your layers and settings, and start the firmware update process."
            }
          </p>
        </Card.Body>
        <Row className="mt-auto">
          <Col xs={6} className="flashingcol">
            <Button
              className="custombutton outlined "
              size="lg"
              onClick={this.cancelDialog}
            >
              {i18n.firmwareUpdate.texts.backwds}
            </Button>
          </Col>
          <Col xs={6} className="flashingcol">
            <Button
              className="flashingbutton nooutlined"
              size="lg"
              onClick={this.backup}
            >
              {countdown > -1 ? buttonText[countdown] : buttonText[""]}
            </Button>
          </Col>
        </Row>
      </Card>
    );

    const advancedUsers = this.state.advanced ? (
      <Card.Body className="centersection mt-4">
        <p className="subtitle thintext">
          <i>
            <strong>{"For advanced users: "}</strong>
            {"If you have installed your own "}
            <a
              href="https://support.dygma.com/hc/en-us/articles/360017062197"
              color={this.props.darkMode === true ? "primary" : "secondary"}
            >
              {i18n.firmwareUpdate.texts.cstomFW}
            </a>
            {", this update will overwrite it."}
          </i>
        </p>
        <Button
          className="custombutton mb-3 outlined"
          size="lg"
          onClick={this.selectFirmware}
        >
          {firmwareFilename == ""
            ? i18n.firmwareUpdate.custom
            : i18n.firmwareUpdate.rcustom}
        </Button>
        {firmwareFilename}
      </Card.Body>
    ) : (
      ""
    );

    const statusCard = (
      <Card className="firmware-card">
        <Card.Header className="header">
          {versions
            ? "Raise Firmware Update"
            : "Firmware Update Process via Bootloader Mode"}
        </Card.Header>
        <Card.Body className="body d-flex flex-column">
          <Card.Title className="title">
            Updating your Raise firmware is how we implement new cool features
            and bug fixes.
          </Card.Title>
          {currentlyRunning}
          {latestAvailable}
        </Card.Body>
        <Row className="mt-auto">
          <Col xs={6} className="flashingcol">
            <Button
              className="custombutton outlined pr-1"
              size="lg"
              onClick={this.toggleAdvanced}
            >
              {i18n.firmwareUpdate.texts.advUsers}
              <MdArrowDropDown className="arrowicon"></MdArrowDropDown>
            </Button>
          </Col>
          <Col xs={6} className="flashingcol">
            <Button
              className="flashingbutton nooutlined"
              size="lg"
              onClick={
                this.state.device.device.info.product === "Raise"
                  ? this.uploadRaise
                  : this.upload
              }
            >
              {i18n.firmwareUpdate.flashing.button}
            </Button>
          </Col>
        </Row>
        <Row className="mt-auto">{advancedUsers}</Row>
      </Card>
    );

    let showCard =
      countdown == -1
        ? statusCard
        : countdown == 0
        ? disclaimerCard
        : countdown == 1
        ? flashCard
        : progress;

    return (
      <Styles>
        <Container fluid className="firmware-update">
          <Row className="title-row">
            <h4 className="section-title">Firmware Update</h4>
          </Row>
          <Row className="firmware-row">
            <Col className="firmware-col">{showCard}</Col>
            {/* <Modal
              show={this.state.confirmationOpen}
              onHide={this.cancelDialog}
              backdrop="static"
              keyboard={false}
              size="xl"
              centered
            >
              <ModalStyle>
                <Modal.Header closeButton>
                  <Modal.Title>{i18n.firmwareUpdate.raise.reset}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{dialogChildren}</Modal.Body>
                <Modal.Footer>
                  <Button
                    onClick={this.state.countdown == 0 ? this.backup : () => {}}
                    variant="contained"
                    color={this.state.countdown ? "primary" : "secondary"}
                    disabled={
                      this.state.countdown !== 0 ? this.props.disabled : null
                    }
                  >
                    {countdown > -1 ? buttonText[countdown] : buttonText[""]}
                  </Button>
                </Modal.Footer>
              </ModalStyle>
            </Modal> */}
          </Row>
        </Container>
      </Styles>
    );
  }
}

export default FirmwareUpdate;
