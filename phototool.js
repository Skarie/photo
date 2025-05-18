const fs = require('fs-extra');
const path = require('path');
const imageSize = require('image-size');

// 相册目录（本地路径）
const photoDir = __dirname;

// 支持的图片格式
const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// GitHub 仓库配置
const githubConfig = {
  owner: 'Skarie',
  repo: 'photo',
  branch: 'main', // 通常是 main 或 master
  baseUrl: 'https://cdn.mengze.vip/gh/' // CDN 前缀
};

// 分类名映射（本地文件夹名 → GitHub 仓库文件夹名）
const categoryMap = {
  '壁纸': 'wallpapers',  // 本地"壁纸"文件夹映射到 GitHub 的"wallpapers"文件夹
  'images': 'images'     // 不需要映射的可以保持原名
};

class Photo {
  constructor() {
    this.dirName = '';   // 分类名（映射后的）
    this.fileName = '';  // 文件名
    this.iconID = '';    // 图片标识（宽.高 文件名）
    this.remoteUrl = ''; // 远程图片 URL
  }
}

class PhotoGroup {
  constructor() {
    this.name = '';      // 分类名（显示用）
    this.children = [];  // 该分类下的所有图片
  }
}

function createPlotIconsData() {
  const allPlots = [];
  const allPlotGroups = [];
  const plotJsonFile = path.join(__dirname, 'photosInfo.json');
  const plotGroupJsonFile = path.join(__dirname, 'photos.json');

  // 读取所有子目录（分类文件夹）
  fs.readdirSync(photoDir)
    .filter(item => {
      const itemPath = path.join(photoDir, item);
      return fs.statSync(itemPath).isDirectory() && item !== 'node_modules'; // 排除 node_modules
    })
    .forEach(dirName => {
      // 获取映射后的分类名
      const mappedCategory = categoryMap[dirName] || dirName;
      
      const dirPath = path.join(photoDir, dirName);
      const subfiles = fs.readdirSync(dirPath);
      
      const group = new PhotoGroup();
      group.name = mappedCategory; // 使用映射后的分类名
      allPlotGroups.push(group);

      subfiles.forEach(subfileName => {
        const imagePath = path.join(dirPath, subfileName);
        
        try {
          // 获取文件状态
          const stat = fs.statSync(imagePath);
          
          // 跳过空文件
          if (stat.size === 0) {
            console.log(`跳过空文件：${imagePath}`);
            return;
          }
          
          // 检查文件扩展名
          const ext = path.extname(subfileName).toLowerCase();
          if (!validExtensions.includes(ext)) {
            console.log(`跳过非图片文件：${imagePath}`);
            return;
          }
          
          // 处理图片
          const plot = new Photo();
          plot.dirName = mappedCategory; // 使用映射后的分类名
          plot.fileName = subfileName;
          
          // 获取图片尺寸
          const imgInfo = imageSize(imagePath);
          plot.iconID = `${imgInfo.width}.${imgInfo.height} ${subfileName}`;
          
          // 生成远程 URL
          plot.remoteUrl = `${githubConfig.baseUrl}${githubConfig.owner}/${githubConfig.repo}/${mappedCategory}/${subfileName}`;
          
          allPlots.push(plot);
          group.children.push(plot.iconID);
          console.log(`✅ 处理成功：${imagePath} → 分类: ${mappedCategory} → 远程URL: ${plot.remoteUrl}`);
        } catch (error) {
          console.error(`❌ 处理失败：${imagePath}`, error.message);
        }
      });
    });

  // 保存结果
  fs.writeJSONSync(plotJsonFile, allPlots);
  fs.writeJSONSync(plotGroupJsonFile, allPlotGroups);
  console.log(`🎉 完成！共处理 ${allPlots.length} 张图片，生成 ${allPlotGroups.length} 个分类`);
  console.log(`💡 提示：请将生成的 photos.json 和 photosInfo.json 以及图片文件夹推送到 GitHub 仓库`);
}

createPlotIconsData();