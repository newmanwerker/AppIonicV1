import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { ZXingScannerComponent } from '@zxing/ngx-scanner';
import { WeatherService } from '../services/weather.service';
import { HttpClient } from '@angular/common/http';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(ZXingScannerComponent) scanner: ZXingScannerComponent | undefined;
  username: string = '';
  role: 'alumno' | 'profesor' | null = null;
  showQRCode: boolean = false;
  isScanning: boolean = false;
  weatherData: any;
  chart: any;
  attendancePercentage: number = 85; // Porcentaje de asistencia

  // Declaración de asignaturas
  asignaturas: { nombre: string, expanded: boolean, showQRCode?: boolean, qrCodeUrl?: string }[] = [
    { nombre: 'Arquitectura de Software', expanded: false },
    { nombre: 'Prog. App Moviles', expanded: false },
    { nombre: 'Diseño de Software', expanded: false }
  ];

  slideOpts = {
    initialSlide: 0,
    speed: 400,
    loop: true,
    slidesPerView: 1,
    spaceBetween: 10
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private weatherService: WeatherService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.username = this.authService.getUsername() || '';
      this.role = this.authService.getRole();
      this.loadWeather('Santiago');
      this.createAttendanceChart();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadWeather(city: string) {
    this.weatherService.getWeather(city).subscribe(
      data => this.weatherData = data,
      error => console.error('Error al obtener el clima:', error)
    );
  }

  createAttendanceChart() {
    setTimeout(() => {
      const ctx = document.getElementById('attendanceChart') as HTMLCanvasElement;
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Asistencia', 'Inasistencia'],
            datasets: [
              {
                data: [this.attendancePercentage, 100 - this.attendancePercentage],
                backgroundColor: ['#4caf50', '#f44336'],
                hoverBackgroundColor: ['#66bb6a', '#e57373']
              }
            ]
          },
          options: {
            cutout: '60%', // grosor del gráfico
            plugins: {
              tooltip: {
                enabled: false
              }
            }
          }
        });
      }
    });
  }

  async logout() {
    this.authService.clear();
    const alert = await this.alertController.create({
      header: 'Sesión Cerrada',
      message: 'Has cerrado sesión exitosamente.',
      buttons: ['OK']
    });
    await alert.present();
    this.router.navigate(['/login']);
  }

  goToResumenAsistencia() {
    this.router.navigate(['/resumen-asistencia']);
  }

  generateQRCode() {
    this.showQRCode = true;
  }

  generateQRCodeForAsignatura(asignatura: any) {
    const qrData = {
      username: this.username,
      subject: asignatura.nombre,
      timestamp: new Date().toISOString()
    };
    asignatura.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(JSON.stringify(qrData))}&size=200x200`;
    asignatura.showQRCode = true;
  }

  startScanning() {
    this.isScanning = true;
  }

  stopScanning() {
    this.isScanning = false;
    if (this.scanner) {
      this.scanner.reset();
    }
  }

  onCodeResult(result: string, asignatura: string) {
    try {
      const scannedData = JSON.parse(result);
      const username = this.username;
      const subject = scannedData.subject || asignatura;
      const timestamp = scannedData.timestamp || new Date().toISOString();

      this.alertController.create({
        header: 'Escaneo Completo',
        message: `
          <strong>Usuario:</strong> ${username}<br>
          <strong>Asignatura:</strong> ${subject}<br>
          <strong>Fecha:</strong> ${new Date(timestamp).toLocaleString()}
        `,
        buttons: ['OK']
      }).then(alert => alert.present());

      this.authService.registerAttendance({ username, subject, timestamp }).subscribe(
        response => console.log('Asistencia registrada:', response),
        error => console.error('Error al registrar asistencia:', error)
      );
    } catch (error) {
      console.error('Error al procesar el QR:', error);
      this.alertController.create({
        header: 'Error',
        message: 'El código QR escaneado no es válido.',
        buttons: ['OK']
      }).then(alert => alert.present());
    }
  }

  toggleExpand(asignatura: { nombre: string, expanded: boolean, showQRCode?: boolean }) {
    this.asignaturas.forEach((a: { nombre: string, expanded: boolean, showQRCode?: boolean }) => {
      if (a !== asignatura) {
        a.expanded = false;
        a.showQRCode = false;
      }
    });
    asignatura.expanded = !asignatura.expanded;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedElement = event.target as HTMLElement;
    if (!clickedElement.closest('ion-card')) {
      this.asignaturas.forEach((asignatura: { nombre: string, expanded: boolean, showQRCode?: boolean }) => {
        asignatura.expanded = false;
        asignatura.showQRCode = false;
      });
    }
  }

  projectQRCode() {
    this.alertController.create({
      header: 'Proyectar QR',
      message: 'Código QR proyectado en pantalla.',
      buttons: ['OK']
    }).then(alert => alert.present());
  }

  goToProfile() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/profile']);
    }
  }
}
