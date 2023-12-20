window.onload = async () => {
  await loadScript();
};

const list_sections = document.querySelector("#sections");

const MOCK = true;

const state = {
  toDownload: [],
  sections: [],
};

async function loadScript() {
  const tabs = await chrome.tabs.query({
    url: "*://*.litmoseu.com/**",
  });
  const activeTab = tabs[0];
  const activeTabId = activeTab.id;
  try {
    if (!MOCK) {
      const courses = await chrome.scripting.executeScript({
        target: {
          tabId: activeTabId,
          allFrames: true,
        },
        files: ["scripts/injected.js"],
      });
      state.sections = courses[0].result;
      courses[0].result.forEach((url) => {
        const section = createListItem(url);
        list_sections.appendChild(section);
      });
    } else {
      const res = await fetch(chrome.runtime.getURL("example.json"));
      const courses = await res.json();
      state.sections = courses[0].result;
      courses[0].result.forEach((url) => {
        const section = createListItem(url);
        list_sections.appendChild(section);
      });
    }
  } catch (err) {
    console.log(err);
  }
}

function createListItem(row) {
  const listItem = document.createElement("li");
  listItem.classList.add("list-group-item", "list-group-item-action", "d-flex", "justify-content-between", "align-items-start");

  const container = document.createElement("div");

  const label = document.createElement("label");
  label.appendChild(document.createTextNode(row.name));
  label.htmlFor = row.name.split(" ").join("");

  const downloadIcon = document.createElement("input");
  downloadIcon.type = "checkbox";
  downloadIcon.id = row.name.split(" ").join("");
  downloadIcon.setAttribute("value", row.name);
  downloadIcon.addEventListener("change", (evt) => {
    if (evt.target.checked) {
      state.toDownload = [...state.toDownload, state.sections.filter((section) => section.name === evt.target.value)[0]];
    } else if (!evt.target.checked) {
      state.toDownload = [
        ...state.toDownload.filter((section) => {
          return section.name !== evt.target.value;
        }),
      ];
    }
  });

  container.appendChild(downloadIcon);
  container.appendChild(label);

  const counter = document.createElement("span");
  counter.textContent = `${row.videos.length} Clases`;
  counter.classList.add("badge", "bg-primary", "rounded-pill");

  listItem.appendChild(container);
  listItem.appendChild(counter);
  return listItem;
}

const downloadButton = document.querySelector("#download");

downloadButton.addEventListener("click", async () => {
  console.log(state);
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    for (const section of state.toDownload) {
      console.log(section.name);
      const newDirectoryHandler = await handle.getDirectoryHandle(section.name.replace(":", ""), {
        create: true,
      });
      for (const download of section.videos) {
        if (!download) {
          continue;
        }
        if (download.name) {
          if (download?.urls?.videoUrl) {
            const newVideo = await newDirectoryHandler.getFileHandle(`${download.name}.mp4`, {
              create: true,
            });
            const writable = await newVideo.createWritable();
            const res = await fetch(download.urls.videoUrl);
            await res.body.pipeTo(writable);
          }
          if (download?.urls?.subtitleUrl) {
            const newVideo = await newDirectoryHandler.getFileHandle(`${download.name}.srt`, {
              create: true,
            });
            const writable = await newVideo.createWritable();
            const res = await fetch(download.urls.subtitleUrl);
            await res.body.pipeTo(writable);
          }
          console.log(download.name + " descargado");
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
});
