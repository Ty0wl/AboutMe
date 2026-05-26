from PIL import Image
import os
import glob

def convert_png_to_jpg(directory=None, quality=85):
    # 🔑 Если папка не указана, используем папку самого скрипта
    if directory is None:
        directory = os.path.dirname(os.path.abspath(__file__))
    
    print(f"🔍 Ищем PNG в папке: {directory}")
    
    # Ищем все PNG файлы только в этой папке
    png_files = glob.glob(os.path.join(directory, '*.png'))
    
    if not png_files:
        print("❌ PNG файлы не найдены. Проверь путь или расширения файлов.")
        return
    
    print(f"✅ Найдено {len(png_files)} файлов. Начинаю конвертацию...\n")
    
    converted = 0
    for png_path in png_files:
        try:
            img = Image.open(png_path)
            
            # JPG не поддерживает прозрачность. Конвертируем в RGB с белым фоном
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Формируем путь для JPG
            jpg_path = os.path.splitext(png_path)[0] + '.jpg'
            
            # Сохраняем
            img.save(jpg_path, 'JPEG', quality=quality, optimize=True)
            
            # Статистика
            png_size = os.path.getsize(png_path) / 1024
            jpg_size = os.path.getsize(jpg_path) / 1024
            savings = ((png_size - jpg_size) / png_size) * 100
            
            print(f"✅ {os.path.basename(png_path)} → {os.path.basename(jpg_path)}")
            print(f"   {png_size:.1f} KB → {jpg_size:.1f} KB (экономия {savings:.1f}%)\n")
            converted += 1
            
        except Exception as e:
            print(f"❌ Ошибка с {os.path.basename(png_path)}: {e}\n")
    
    print(f"🎉 Готово! Обработано {converted} из {len(png_files)} файлов.")
    print("💡 Не забудь заменить .png на .jpg в коде сайта!")

if __name__ == '__main__':
    convert_png_to_jpg(quality=85)