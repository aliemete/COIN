import { el } from 'redom';
import ymaps from 'ymaps';
import AuthService from './AuthService';

export default class AtmMap {
  constructor() {
    this.authService = new AuthService();

    // Создаем контейнер для карты
    this.el = el('div', { class: 'atm-map-container' }, [
      el('h2', { class: 'atm-map-title' }, 'Карта банкоматов'), // Динамический заголовок
      (this.mapContainer = el('div', { id: 'atm-map' })), // Контейнер для карты
    ]);

    // Инициализируем карту
    this.initMap();
  }

  // Метод для отображения skeleton-лоадера
  showSkeleton() {
    if (this.mapContainer && this.mapContainer.parentNode) {
      this.skeleton = el('div', { class: 'skeleton-map' }, 'Загрузка карты...');
      this.mapContainer.parentNode.insertBefore(this.skeleton, this.mapContainer);
      this.mapContainer.style.display = 'none'; // Скрываем контейнер карты
    }
  }

  // Метод для скрытия skeleton-лоадера
  hideSkeleton() {
    if (this.skeleton && this.skeleton.parentNode) {
      this.skeleton.parentNode.removeChild(this.skeleton); // Удаляем skeleton
      this.skeleton = null;
    }
    if (this.mapContainer) {
      this.mapContainer.style.display = 'block'; // Показываем контейнер карты
    }
  }

  // Метод для инициализации карты
  async initMap() {
    this.showSkeleton(); // Показываем skeleton-лоадер

    try {
      // Загружаем API Яндекс.Карт с API-ключом
      const maps = await ymaps.load('https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=ваш_ключ');

      // Создаем карту
      this.map = new maps.Map(this.mapContainer, {
        center: [55.751244, 37.618423], // Центр карты (Москва)
        zoom: 12, // Масштаб
      });

      // Загружаем точки банкоматов
      const atms = await this.authService.fetchBanks();
      this.addAtmMarkers(maps, atms);

      this.hideSkeleton(); // Скрываем skeleton-лоадер после загрузки карты
    } catch (error) {
      console.error('Ошибка при инициализации карты:', error);
      this.hideSkeleton(); // Скрываем skeleton-лоадер в случае ошибки
      this.el.textContent = 'Не удалось загрузить карту. Попробуйте позже.';
    }
  }

  // Метод для добавления меток банкоматов
  addAtmMarkers(maps, atms) {
    atms.forEach(atm => {
      const marker = new maps.Placemark(
        [atm.lat, atm.lon],
        { balloonContent: 'Coin.' },
        { preset: 'islands#blueDotIcon' }
      );
      this.map.geoObjects.add(marker);
    });
  }
}