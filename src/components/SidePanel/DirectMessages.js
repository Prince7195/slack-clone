import React from "react";
import { Menu, Icon, Modal, Form, Input, Button } from "semantic-ui-react";
import { connect } from "react-redux";

import firebase from "../../firebase";
import { setCurrentChannel, setPrivateChannel } from "../../store/actions";

class DirectMessages extends React.Component {
  state = {
    user: this.props.currentUser,
    users: [],
    usersRef: firebase.database().ref("users"),
    connectedRef: firebase.database().ref(".info/connected"),
    presenceRef: firebase.database().ref("presence"),
    activeChannel: "",
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid);
    }
  }

  addListeners = (currentUserUid) => {
    const loadedUsers = [];
    this.state.usersRef.on("child_added", (snap) => {
      if (currentUserUid !== snap.key) {
        const user = snap.val();
        user["uid"] = snap.key;
        user["status"] = "offline";
        loadedUsers.push(user);
        this.setState({ users: loadedUsers });
      }
    });

    this.state.connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        const ref = this.state.presenceRef.child(currentUserUid);
        ref.set(true);
        ref.onDisconnect().remove((err) => {
          if (err !== null) {
            console.error(err);
          }
        });
      }
    });

    this.state.presenceRef.on("child_added", (snap) => {
      if (currentUserUid !== snap.key) {
        // add status to user
        this.addStatusToUser(snap.key);
      }
    });

    this.state.presenceRef.on("child_removed", (snap) => {
      if (currentUserUid !== snap.key) {
        // add status to user
        this.addStatusToUser(snap.key, false);
      }
    });
  };

  addStatusToUser = (userId, connected = true) => {
    const updatedUser = this.state.users.reduce((acc, user) => {
      if (user.uid === userId) {
        user["status"] = connected ? "online" : "offline";
      }
      return acc.concat(user);
    }, []);

    this.setState({ users: updatedUser });
  };

  isUserOnline = (user) => user.status === "online";

  changeChannel = (user) => {
    const channelId = this.getChannelId(user.uid);
    const channelData = {
      id: channelId,
      name: user.name,
    };
    this.props.setCurrentChannel(channelData);
    this.props.setPrivateChannel(true);
  };

  setActiveChannel = (userId) => {
    this.setState({ activeChannel: userId });
  };

  getChannelId = (userId) => {
    const currentUserId = this.state.user.uid;
    return userId < currentUserId
      ? `${userId}/${currentUserId}`
      : `${currentUserId}/${userId}`;
  };

  render() {
    const { users, activeChannel } = this.state;
    return (
      <>
        <Menu.Menu style={{ paddingBottom: "2em" }}>
          {/* Heading */}
          <Menu.Item>
            <span>
              <Icon name="mail" />
            </span>{" "}
            DIRECT MESSAGES ({users.length}) <Icon name="add" />
          </Menu.Item>
          {/* Users to send Direct messages */}
          {users.map((user) => {
            return (
              <Menu.Item
                key={user.uid}
                active={user.uid === activeChannel}
                onClick={() => this.changeChannel(user)}
                style={{ opacity: 0.7, fontStyle: "italic" }}
              >
                <Icon
                  name="circle"
                  color={this.isUserOnline(user) ? "green" : "red"}
                />
                @ {user.name}
              </Menu.Item>
            );
          })}
        </Menu.Menu>
      </>
    );
  }
}

export default connect(null, { setCurrentChannel, setPrivateChannel })(
  DirectMessages
);
