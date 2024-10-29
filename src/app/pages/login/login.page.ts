import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  username: string = '';
  password: string = '';
  isUsernameFocused: boolean = false;
  isPasswordFocused: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ionViewWillEnter() {
    this.username = '';
    this.password = '';
  }

  onUsernameFocus() {
    this.isUsernameFocused = true;
  }

  onUsernameBlur() {
    if (!this.username) {
      this.isUsernameFocused = false;
    }
  }

  onPasswordFocus() {
    this.isPasswordFocused = true;
  }

  onPasswordBlur() {
    if (!this.password) {
      this.isPasswordFocused = false;
    }
  }

  login() {
    if (this.authService.authenticate(this.username, this.password)) {
      this.router.navigate(['/home']);
    } else {
      alert('Inicio de sesión fallido: usuario o contraseña incorrectos');
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToResetPassword() {
    this.router.navigate(['/reset-password']);
  }
}
