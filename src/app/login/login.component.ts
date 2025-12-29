import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthResponse, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class Login {
  isLogin = true;

  loginEmail = '';
  loginPwd = '';
  showLoginPwd = false;

  regEmail = '';
  regPwd = '';
  regPwdConfirm = '';
  showRegPwd = false;

  alertMsg = '';
  alertType: 'success' | 'danger' | '' = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  showLoginTab(): void {
    this.isLogin = true;
    this.clearAlerts();
  }

  showRegisterTab(): void {
    this.isLogin = false;
    this.clearAlerts();
  }

  toggleLoginPwd(): void {
    this.showLoginPwd = !this.showLoginPwd;
  }

  toggleRegPwd(): void {
    this.showRegPwd = !this.showRegPwd;
  }

  private clearAlerts(): void {
    this.alertMsg = '';
    this.alertType = '';
  }

  private showAlert(type: 'success' | 'danger', msg: string): void {
    this.alertMsg = msg;
    this.alertType = type;
    setTimeout(() => { this.clearAlerts(); }, 3500);
  }

  onLogin(): void {
    console.log('=== LOGIN STARTED ===');
    this.clearAlerts();
    
    if (!this.loginEmail || !this.loginPwd) {
      console.log('❌ Validation failed: Empty fields');
      this.showAlert('danger', 'Please enter email and password');
      return;
    }
    
    console.log('Setting loading = true');
    this.loading = true;

    console.log('Calling auth.login()...');
    const subscription = this.auth.login(this.loginEmail, this.loginPwd).subscribe({
      next: (res) => {
        console.log('✅ Login SUCCESS - Response received:', res);
        console.log('Setting loading = false');
        this.loading = false;
        
        if (res?.token) {
          this.auth.saveToken(res.token);
          console.log('Token saved');
        }
        
        this.showAlert('success', 'Logged in successfully!');
        console.log('Alert shown');
        
        this.loginEmail = '';
        this.loginPwd = '';
        
        console.log('Navigating to dashboard in 1 second...');
        setTimeout(() => {
          this.router.navigateByUrl('/dashboard');
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Login ERROR:', err);
        console.log('Setting loading = false (error)');
        this.loading = false;
        this.showAlert('danger', err?.error?.msg || 'Login failed');
      },
      complete: () => {
        console.log('✅ Login request completed');
      }
    });

    console.log('Subscription created:', subscription);
  }

  onRegister(): void {
    console.log('=== REGISTRATION STARTED ===');
    this.clearAlerts();
    
    console.log('Form values:', {
      email: this.regEmail,
      pwd: this.regPwd,
      confirm: this.regPwdConfirm
    });
    
    if (!this.regEmail || !this.regPwd || !this.regPwdConfirm) {
      console.log('❌ Validation failed: Empty fields');
      this.showAlert('danger', 'All fields required');
      return;
    }
    
    if (this.regPwd.length < 6) {
      console.log('❌ Validation failed: Password too short');
      this.showAlert('danger', 'Password must be at least 6 characters');
      return;
    }
    
    if (this.regPwd !== this.regPwdConfirm) {
      console.log('❌ Validation failed: Passwords do not match');
      this.showAlert('danger', 'Passwords do not match');
      return;
    }
    
    console.log('✅ Validation passed');
    console.log('Setting loading = true');
    this.loading = true;

    console.log('Calling auth.register()...');
    const subscription = this.auth.register(this.regEmail, this.regPwd).subscribe({
      next: (res) => {
        console.log('✅ Registration SUCCESS - Response received:', res);
        console.log('Setting loading = false');
        this.loading = false;
        
        this.showAlert('success', 'Account created successfully!');
        console.log('Alert shown');
        
        this.regEmail = '';
        this.regPwd = '';
        this.regPwdConfirm = '';
        console.log('Form cleared');
        
        console.log('Switching to login tab in 1 second...');
        setTimeout(() => {
          console.log('Executing showLoginTab()');
          this.showLoginTab();
        }, 1000);
      },
      error: (err) => {
        console.error('❌ Registration ERROR:', err);
        console.error('Error details:', err.error);
        console.log('Setting loading = false (error)');
        this.loading = false;
        this.showAlert('danger', err?.error?.msg || 'Registration failed');
      },
      complete: () => {
        console.log('✅ Registration request completed');
      }
    });

    console.log('Subscription created:', subscription);
  }
}
