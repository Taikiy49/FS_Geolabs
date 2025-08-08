import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Admin.css';
import API_URL from '../config';
import { useMsal } from '@azure/msal-react';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { accounts } = useMsal();
  const currentUserEmail = accounts[0]?.username || '';
  const SUPER_OWNER_EMAIL = 'tyamashita@geolabs.net';

  // Sort users: Owner > Admin > User
  const rolePriority = { 'Owner': 0, 'Admin': 1, 'User': 2 };
  const sortedUsers = [...users].sort((a, b) => {
    const priorityA = rolePriority[a.role] ?? 99;
    const priorityB = rolePriority[b.role] ?? 99;
    return priorityA - priorityB;
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (email, role) => {
    if (email === SUPER_OWNER_EMAIL && currentUserEmail !== SUPER_OWNER_EMAIL) {
      alert("You can't modify the Super Owner.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/update-role`, { email, role });
      setUsers(users.map(u => (u.email === email ? { ...u, role } : u)));
    } catch (error) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.error || 'Failed to update role.');
    }
  };

  const deleteUser = async (email) => {
    if (email === SUPER_OWNER_EMAIL) {
      alert("You cannot delete the Super Owner.");
      return;
    }
    if (email === currentUserEmail) {
      alert("You cannot delete yourself.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      await axios.post(`${API_URL}/api/delete-user`, { email });
      setUsers(users.filter(u => u.email !== email));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.error || 'Failed to delete user.');
    }
  };

  const isOwner = currentUserEmail === SUPER_OWNER_EMAIL ||
    users.find(u => u.email === currentUserEmail)?.role === 'Owner';

  const isEditable = (targetEmail, targetRole) => {
    if (currentUserEmail === SUPER_OWNER_EMAIL) return true; // Super Owner can do anything
    if (targetEmail === SUPER_OWNER_EMAIL) return false; // Nobody can edit Super Owner
    if (!isOwner) return false; // Must be an Owner
    if (targetEmail === currentUserEmail) return false; // Can't edit yourself
    return targetRole === 'User' || targetRole === 'Admin';
  };

  const getOptionsForTarget = (targetEmail, targetRole) => {
    if (currentUserEmail === SUPER_OWNER_EMAIL) {
      return ['User', 'Admin', 'Owner'];
    }
    if (targetRole === 'User' || targetRole === 'Admin') {
      return ['User', 'Admin'];
    }
    return ['Owner']; // locked
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="main-content"><p>Loading users...</p></div>;

  return (
    <div className="admin-container">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Current Role</th>
            <th>Change Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map(user => {
            const isSelf = user.email === currentUserEmail;
            const editable = isEditable(user.email, user.role);

            return (
              <tr key={user.email} className={
  user.role === 'Owner' ? 'owner-row' :
  user.role === 'Admin' ? 'admin-row' :
  'user-row'
}>

                <td>
                  {user.email}
                  {isSelf && <span style={{ color: 'green', marginLeft: 6 }}>(you)</span>}
                </td>
                <td>{user.role}</td>
                <td>
                  {editable ? (
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.email, e.target.value)}
                    >
                      {getOptionsForTarget(user.email, user.role).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ color: '#888' }}>Locked</span>
                  )}
                </td>
                <td>
                  {user.email !== SUPER_OWNER_EMAIL && !isSelf ? (
                    <button
                      onClick={() => deleteUser(user.email)}
                      style={{ color: 'red', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  ) : (
                    <span style={{ color: '#888' }}>Locked</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
