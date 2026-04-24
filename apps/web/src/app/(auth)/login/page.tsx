'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setMessage('正在登录...');

    try {
      const response = await fetch('http://113.44.50.108:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

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
      setMessage('网络错误: ' + String(err));
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>登录</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>邮箱</label><br />
          <input
            name="email"
            type="email"
            defaultValue="test@test.com"
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>密码</label><br />
          <input
            name="password"
            type="password"
            defaultValue="test123"
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <button
          type="submit"
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
      </form>

      {message && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
          {message}
        </div>
      )}
    </div>
  );
}