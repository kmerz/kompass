import { useState } from 'react';

function LoginForm({
  onLogin,
}: {
  onLogin: (username: string, password:string) => Promise<void>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (username.trim() == '') { 
      setError("Username missing");
      return; 
    };

    if (password.trim() == '') { 
      setError("Password missing");
      return;
    };

    onLogin(username, password);

    setUsername('');
    setPassword('');
  };

  return (
      <>
      {error && <span className="error">{error}</span>}
      <form className="login-form" onSubmit={handleSubmit}>
        <label>Username
        <input
	  type="text"
	  value={username}
	  onChange={(e) => setUsername(e.target.value)}
	/>
	</label>
        <label>Password
        <input
	  type="password"
	  value={password}
	  onChange={(e) => setPassword(e.target.value)}
	/>
	</label>
	<button type="submit">
	  Login
	</button>
      </form>
      </>
  );
}

export default LoginForm;
