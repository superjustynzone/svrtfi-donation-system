import axios from "axios";
import { useEffect, useState } from "react";

function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/users")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>All Users</h1>
      {users.map(u => (
        <p key={u.user_id}>{u.first_name} {u.last_name} {u.address}</p>
      ))}
    </div>
  );
}

export default UsersPage;
