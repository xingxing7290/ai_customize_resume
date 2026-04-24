'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    console.log('handleLogin called, email:', email);
    setMessage('正在登录...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://113.44.50.108:3001';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (data.code === 200 && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        setMessage('登录成功！正在跳转...');
        setTimeout(() => {
          window.location.href = '/profiles';
        }, 1000);
      } else {
        setMessage('登录失败: ' + (data.message || '未知错误'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('网络错误: ' + String(err));
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>登录</h1>

      <div style={{ marginBottom: '15px' }}>
        <label>邮箱</label><br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          placeholder="test@test.com"
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>密码</label><br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          placeholder="test123"
        />
      </div>

      <button
        type="button"
        onClick={handleLogin}
        style={{
          width: '100%',
          padding: '12px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        登录
      </button>

      {message && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
          {message}
        </div>
      )}
    </div>
  );
}