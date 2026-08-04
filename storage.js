// js/api.js — فایل جدید برای ارتباط با بک‌اند

const API_BASE = 'http://localhost:3000/api';

class API {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'خطا در ارتباط با سرور');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  // Auth
  static register(email, phone) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, phone })
    });
  }
  
  static verify(userId, code) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ userId, code })
    });
  }
  
  // Chat
  static async sendMessage(message, context) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }
  
  // Projects
  static saveProject(project) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  }
  
  static getProjects() {
    return this.request('/projects');
  }
}