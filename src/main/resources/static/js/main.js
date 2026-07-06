document.addEventListener('DOMContentLoaded', () => {
    // 모바일 햄버거 메뉴 토글
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });
    }
});
