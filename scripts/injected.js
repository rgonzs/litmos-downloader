async function getCourses() {
  console.log("inicia proceso");
  const all = [];
  let sectionCounter = 1;
  const tables = document.querySelectorAll("#courses > .panel.panel-default.no-overflow");
  for (const table of tables) {
    const sectionName = `${sectionCounter}. ${table.querySelector(".l-lp-course-heading > div").firstChild.nodeValue.trim()}`;
    const promises = [];
    let lessonCounter = 1;
    const links = table.querySelectorAll(".l-module-link");
    for (const link of links) {
      const videoName = `${lessonCounter}. ${link.childNodes[0].nodeValue.trim()}`;
      const lessonUrl = link.href;
      const videoUrls = getVideoUrls(videoName, lessonUrl);
      console.log("Promesa creada " + lessonCounter);
      promises.push(videoUrls);
      lessonCounter++;
    }
    const videos = await Promise.all(promises);

    all.push({ name: sectionName, videos });
    sectionCounter++;
  }
  return all;
}

async function getVideoUrls(name, url) {
  try {
    const videoExp = /label:\s'HIGH',\sfile:\s'(https:\/\/.*)'/;
    const subtitleExp = /file:\s'(https:\/\/.*)',\s\slabel:\s'English',\skind:\s'captions'/;
    const res = await fetch(url);
    const data = await res.text();
    let videoUrl = "";
    if (data.match(videoExp)) {
      videoUrl = data.match(videoExp)[1];
    }
    let subtitleUrl = "";
    if (data.match(subtitleExp)) {
      subtitleUrl = data.match(subtitleExp)[1];
    }
    return { name, urls: { videoUrl, subtitleUrl } };
  } catch (error) {
    console.log(error);
  }
}

getCourses();
