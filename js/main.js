// Draw the full waveform of the audio
function drawWaveform(data, canvas, currentTime, totalTime, promptTime = 3) {
  const ctx = canvas.getContext("2d");
  // console.log((new Date()).getTime());

  const step = Math.ceil(data.length / canvas.width);
  const amp = canvas.height / 2;
  const currentRatio = currentTime / totalTime;
  const promptRatio = promptTime / totalTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "transparent"; // Background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = 2; //4;      // Width of each bar
  const gap = 1; // Space between bars

  let maxVal = 0;
  let sumArray = [];
  for (let i = 0; i < canvas.width; i += barWidth + gap) {
    let sum = 0;
    for (let j = 0; j < step; j++) {
      // const datum = data[(i * step / (barWidth + gap)) + j];
      const datum = Math.abs(data[i * step + j]);
      sum += datum;
    }
    sumArray.push(sum);
    maxVal = Math.max(sum, maxVal);
  }

  for (let i = 0; i < canvas.width; i += barWidth + gap) {
    let mean = sumArray[Math.round(i / (barWidth + gap))] / maxVal;
    mean = Math.pow(mean, 0.8);
    mean = Math.max(mean, 0.05);
    // console.log(maxVal, mean);
    if (i < currentRatio * canvas.width) {
      if (i < promptRatio * canvas.width) {
        ctx.fillStyle = "#8FBDDF"; //"#F06A8A";
      } else {
        ctx.fillStyle = "#9FDE83"; //"#8FBDDF";
      }
    } else {
      ctx.fillStyle = "#858585";
    }
    ctx.beginPath();
    // ctx.fillRect(i, (1 + min) * amp, barWidth, (max - min) * amp);
    ctx.roundRect(i, (1 - mean) * amp, barWidth, 2 * mean * amp, [100]);
    // ctx.stroke();
    ctx.fill();
  }
}

function audioVisualizer(audio, canvas, promptTime = 3) {
  let audioData = null;

  // Set up AudioContext and Analyzer
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Fetch and decode the audio file data
  fetch(audio.src)
    .then((response) => response.arrayBuffer())
    .then((data) => audioContext.decodeAudioData(data))
    .then((buffer) => {
      audioData = buffer.getChannelData(0);
      drawWaveform(audioData, canvas, 0, audio.duration, promptTime);
    });

  audio.addEventListener("play", function () {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  });

  let userInteracted = false;
  audio.addEventListener("seeking", function () {
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    userInteracted = true;
  });

  // Update waveform display during audio playback
  setInterval(function () {
    if (audio.paused != true || userInteracted) {
      drawWaveform(
        audioData,
        canvas,
        audio.currentTime,
        audio.duration,
        promptTime,
      );
      userInteracted = false;
    }
  }, 50);
}

function divBuilderLibriSpeech(id, data) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data["text_list"].length; i++) {
    const copiedNode = document.importNode(
      document.querySelector("#prompt-template").content,
      true,
    );

    // inject values
    const promptText = copiedNode.querySelector(".ditto-prompt-text > span");
    promptText.innerText = data["prompt_text_list"][i];
    const text = copiedNode.querySelector(".ditto-text > span");
    text.innerText = data["text_list"][i];

    const audioOursAll = copiedNode.querySelector(".ditto-audioviz audio");
    audioOursAll.setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "ours_all"),
    );

    const sampleAudioList = copiedNode.querySelectorAll(
      ".ditto-sample-box audio",
    );
    sampleAudioList[0].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "prompt"),
    );
    sampleAudioList[1].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "gt"),
    );
    sampleAudioList[2].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "yourtts"),
    );
    sampleAudioList[3].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "vall-e"),
    );
    sampleAudioList[4].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "clam"),
    );

    const card = copiedNode.querySelectorAll(".ditto-sample-box table tr")
    card.forEach((elm, idx) => {
      elm.removeChild(elm.children[5]);
    });

    // inject functions
    const canvas = copiedNode.querySelector(".ditto-audioviz canvas");
    audioVisualizer(audioOursAll, canvas, data["prompt_time"][i]);

    const toggle = copiedNode.querySelector(".ditto-toggle");
    const sampleBox = copiedNode.querySelector(".ditto-sample-box");
    toggle.children[0].onclick = function () {
      toggle.children[0].classList.remove("show");
      toggle.children[1].classList.add("show");
      sampleBox.classList.add("show");
    };
    toggle.children[1].onclick = function () {
      toggle.children[0].classList.add("show");
      toggle.children[1].classList.remove("show");
      sampleBox.classList.remove("show");
    };
    const openToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(1)",
    );
    const closeToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(2)",
    );

    fragment.appendChild(copiedNode);
  }

  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote1-1">1</sup><a href="https://edresson.github.io/YourTTS/">https://edresson.github.io/YourTTS/</a><br>';
  const footnote2 = document.createElement("span");
  footnote2.innerHTML =
    '<sup id="footnote1-2">2</sup><a href="https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e/">https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e/</a><br>';
  const footnote3 = document.createElement("span");
  footnote3.innerHTML =
    '<sup id="footnote1-3">3</sup><a href="https://clam-tts.github.io/">https://clam-tts.github.io/</a>';

  fragment.appendChild(footnote1);
  fragment.appendChild(footnote2);
  fragment.appendChild(footnote3);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilder(id, data) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data["text_list"].length; i++) {
    const copiedNode = document.importNode(
      document.querySelector("#prompt-template").content,
      true,
    );

    // inject values
    const promptText = copiedNode.querySelector(".ditto-prompt-text > span");
    promptText.innerText = data["prompt_text_list"][i];
    const text = copiedNode.querySelector(".ditto-text > span");
    text.innerText = data["text_list"][i];

    const audioOursAll = copiedNode.querySelector(".ditto-audioviz audio");
    audioOursAll.setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "ours_all"),
    );

    const sampleAudioList = copiedNode.querySelectorAll(
      ".ditto-sample-box audio",
    );
    sampleAudioList[0].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "prompt"),
    );
    sampleAudioList[1].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "gt"),
    );
    sampleAudioList[2].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "yourtts"),
    );
    sampleAudioList[3].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "vall-e"),
    );
    sampleAudioList[4].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "clam"),
    );
    sampleAudioList[5].setAttribute(
      "src",
      data["path_template_list"][i].replace("{}", "megatts"),
    );

    // inject functions
    const canvas = copiedNode.querySelector(".ditto-audioviz canvas");
    audioVisualizer(audioOursAll, canvas, data["prompt_time"][i]);

    const toggle = copiedNode.querySelector(".ditto-toggle");
    const sampleBox = copiedNode.querySelector(".ditto-sample-box");
    toggle.children[0].onclick = function () {
      toggle.children[0].classList.remove("show");
      toggle.children[1].classList.add("show");
      sampleBox.classList.add("show");
    };
    toggle.children[1].onclick = function () {
      toggle.children[0].classList.add("show");
      toggle.children[1].classList.remove("show");
      sampleBox.classList.remove("show");
    };
    const openToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(1)",
    );
    const closeToggle = copiedNode.querySelector(
      ".ditto-toggle div:nth-child(2)",
    );

    fragment.appendChild(copiedNode);
  }

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilderMLS(id, data) {
  divBuilder(id, data);

  const cards = document.querySelectorAll(id + " .ditto-card");
  for (let i = 0; i < data["text_list"].length; i++) {
    cards[i].querySelector("div:nth-child(1)").innerHTML =
      "<p><strong>Prompt + Text (" +
      data["lang_list"][i] +
      ")</strong>: " +
      data["text_list"][i] +
      "</p>";

    cards[i]
      .querySelectorAll(".ditto-sample-box table tr")
      .forEach((elm, idx) => {
        elm.removeChild(elm.children[5]);
        elm.removeChild(elm.children[3]);
        elm.removeChild(elm.children[2]);
      });
  }

  const fragment = document.createDocumentFragment();
  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote2-1">1</sup><a href="https://clam-tts.github.io/">https://clam-tts.github.io/</a>';

  fragment.appendChild(footnote1);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilderCeleb(id, data) {
  divBuilder(id, data);

  const cards = document.querySelectorAll(id + " .ditto-card");
  for (let i = 0; i < data["text_list"].length; i++) {
    cards[i].querySelector("div:nth-child(1)").innerHTML =
      "<p style='font-weight: bold;'>Celeb: " +
      data["name_list"][i] +
      "</p>" +
      cards[i].querySelector("div:nth-child(1)").innerHTML;
    cards[i]
      .querySelectorAll(".ditto-sample-box table tr")
      .forEach((elm, idx) => {
        elm.removeChild(elm.children[5]);
        elm.removeChild(elm.children[3]);
        elm.removeChild(elm.children[2]);
        elm.removeChild(elm.children[1]);
      });
  }

  const fragment = document.createDocumentFragment();
  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote3-1">1</sup><a href="https://clam-tts.github.io/">https://clam-tts.github.io/</a>';

  fragment.appendChild(footnote1);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

function divBuilderAnime(id, data) {
  divBuilder(id, data);

  const cards = document.querySelectorAll(id + " .ditto-card");
  for (let i = 0; i < data["text_list"].length; i++) {
    cards[i].querySelector("div:nth-child(1)").innerHTML =
      "<p style='font-weight: bold;'>Anime: " +
      data["name_list"][i] +
      "</p>" +
      cards[i].querySelector("div:nth-child(1)").innerHTML;
    cards[i]
      .querySelectorAll(".ditto-sample-box table tr")
      .forEach((elm, idx) => {
        elm.removeChild(elm.children[3]);
        elm.removeChild(elm.children[2]);
        elm.removeChild(elm.children[1]);
      });
  }

  const fragment = document.createDocumentFragment();
  const footnote1 = document.createElement("span");
  footnote1.innerHTML =
    '<sup id="footnote4-1">1</sup><a href="https://boostprompt.github.io/boostprompt/">https://boostprompt.github.io/boostprompt/</a>';

  fragment.appendChild(footnote1);

  const root = document.querySelector(id);
  root.appendChild(fragment);
}

const librispeechData = {
  text_list: [
    "They moved thereafter cautiously about the hut groping before and about them to find something to show that Warrenton had fulfilled his mission.",
    "And lay me down in thy cold bed and leave my shining lot.",
    "Number ten, fresh nelly is waiting on you, good night husband.",
    "Yea, his honourable worship is within, but he hath a godly minister or two with him, and likewise a leech.",
    "Instead of shoes, the old man wore boots with turnover tops, and his blue coat had wide cuffs of gold braid.",
    "The army found the people in poverty and left them in comparative wealth.",
    "Thus did this humane and right minded father comfort his unhappy daughter, and her mother embracing her again, did all she could to soothe her feelings.",
    "He was in deep converse with the clerk and entered the hall holding him by the arm",
  ],

  path_template_list: [
    "audios/librispeech/librispeech_61-70970-0024_{}.wav",
    "audios/librispeech/librispeech_908-157963-0027_{}.wav",
    "audios/librispeech/librispeech_1089-134686-0004_{}.wav",
    "audios/librispeech/librispeech_1221-135767-0014_{}.wav",
    "audios/librispeech/librispeech_1284-1180-0002_{}.wav",
    "audios/librispeech/librispeech_4077-13754-0000_{}.wav",
    "audios/librispeech/librispeech_5639-40744-0020_{}.wav",
    "audios/librispeech/librispeech_61-70970-0007_{}.wav",
  ],

  prompt_text_list: [
    "ly descended the ladder and found himself soon upon firm rock",
    "milked cow and tames the fi",
    "paced up and down waiting but he could wait no long",
    "windows the wooden shutters to close over them at",
    "he told his visitors as he lighted a pipe with a",
    "an tribes have generally regarded the religion of the latter day sa",
    "ings were showered upon him by all who saw him",
    "urs passed wearily by and movement could yet be heard about",
  ],
  prompt_time: Array(8).fill(3),
};

const mlsData = {
  text_list: [
    "o god our hands are few and faint our hope rests all with thee lend us thy hand in this sore strait and thine the glory be",
    "angelica broke in in her energetic way if you're going to be a duke i won't be left plain miss hamilton wells you couldn't be plain miss anything",
    "같은 시간 에프조의 멕시코와 스웨덴 역시 조별리그 삼차전을 치른다.",
    "실현할 기회를 얻지 못하다 미국의 전기회사를 방문해 계획을 말했습니다.",
    "und grinst nun erst beginnt die praktische übung bin ich nicht schon allzu erschöpft durch das theoretische wohl allzu erschöpft das gehört zu meinem schicksal trotzdem greife ich so gut ich kann nach der hingereichten flasche",
    "wenn nicht mr osborne ein bescheidener fußgänger gewesen wäre noch ist der beifall in der luft da lösen ihn plötzlich andere töne ab der marquis von blandford",
    "en toen jammerde het ook in het schrijfboek van hjalmar o dat was vreselijk om aan te horen op iedere bladzijde stonden van boven naar beneden de grote letters en naast iedere grote letter stond een kleine dat was het voorbeeld",
    "neen niet op de achterste rij ook niet naast jantje kroeze dat gaat geen twee dagen goed vooraan dan maar nee die bank is te klein voor hem en daar zit hij ook de kleinere jongens achter hem in de weg",
    "au lieu de répondre à ces questions le jeune homme se mit à pleurer amèrement que la fortune est inconstante s'écria-t-il elle se plaît à abaisser les hommes qu'elle a élevés",
    "et de se savoir ainsi chantée par un poète cela lui fit oublier toute modestie elle allongea son cou derrière ses feuilles tourna vaniteusement sa tête à gauche et à droite et se mira avec complaisance dans une grosse goutte de rosée qui était restée pendue à un brin d'herbe",
    "lo quise decir a vuestra merced es que es fama en este pueblo que no hay gente más mala que las placeras porque todas son desvergonzadas desalmadas y atrevidas y yo así lo creo por las que he visto en otros pueblos",
    "en otro cajón el valor de treinta y seis libras esterlinas en moneda de europa y del brasil parte en oro parte en plata y entre otras algunas piezas de a ocho a la vista de aquel dinero me sonreí sardónicamente metal miserable exclamé de qué puedes servirme",
    "molto impensierito della diffusione del malcostume per opera della stampa quotidiana proibisce alla moglie e alla figliuola la lettura dei giornali la piccola medea è stata educata secondo le rigide massime di condotta che a lui",
    "però disse il maestro se tu tronchi qualche fraschetta d'una d'este piante e pensier c'hai si faran tutti monchi",
    "o homem ao destacar-se do último elo da cadeia dos seres sentiu-se forte e senhor da terra a natureza oferecia-lhe por toda a parte seus peitos uberantes e este regozijo de harmonia ligava a sua existência a vida panteística do universo",
    "a influência manifesta do cristianismo é a comuna o abraço dos povos pelo trabalho do comércio e da indústria eis o segredo das riquezas de pisa grand veneza genova bruges e florença ao pé da barbárie dos estados feudais",
    "choćby nawet z kamyków ułożony niema dla niego żadnej wagi bo gatunkowo nie jest ani cięższym ani lżejszym od wody gdyby było inaczej to jest gdyby był cięższym męczyłby bezpotrzebnie właściciela w przeciwnym zaś razie unosiłby go łatwo w górę i utrudniał pełzanie po dnie",
    "nie mają one zupełnie zwierzchników jeśli w ulu matka pszczół jest tylko matką ale nie królową jak to niektórzy badacze mylnie twierdzili to tem bardziej w mrowisku nie może być mowy o królowych gdzie matek jest zwykle kilka przy jednowładztwie zresztą musi być przymus tymczasem mrówki nie podlegają żadnemu zgoła przymusowi",
  ],

  path_template_list: [
    "audios/mls/mls_english_10611_10308_000071_{}.wav",
    "audios/mls/mls_english_12278_12446_000057_{}.wav",
    "audios/multi/0006_G2A3E7_KYH_001279_wav_c_2_{}.wav",
    "audios/multi/0001_G1A3E6S0C0_PSB_000046_wav_c_0_{}.wav",
    "audios/mls/mls_german_2252_1599_000090_{}.wav",
    "audios/mls/mls_german_1844_931_000001_{}.wav",
    "audios/mls/mls_dutch_3034_2211_000142_{}.wav",
    "audios/mls/mls_dutch_3798_4626_000595_{}.wav",
    "audios/mls/mls_french_296_1028_000040_{}.wav",
    "audios/mls/mls_french_10179_11051_000033_{}.wav",
    "audios/mls/mls_spanish_3471_1378_000155_{}.wav",
    "audios/mls/mls_spanish_8585_9503_000072_{}.wav",
    "audios/mls/mls_italian_8582_7877_000066_{}.wav",
    "audios/mls/mls_italian_280_529_000089_{}.wav",
    "audios/mls/mls_portuguese_13063_13511_000009_{}.wav",
    "audios/mls/mls_portuguese_13063_13511_000045_{}.wav",
    "audios/mls/mls_polish_9098_8338_000009_{}.wav",
    "audios/mls/mls_polish_8758_8338_000023_{}.wav",
  ],
  lang_list: [
    "English",
    "English",
    "Korean",
    "Korean",
    "German",
    "German",
    "Dutch",
    "Dutch",
    "French",
    "French",
    "Spanish",
    "Spanish",
    "Italian",
    "Italian",
    "Portuguese",
    "Portuguese",
    "Polish",
    "Polish",
  ],
  prompt_text_list: new Array(18),
  prompt_time: Array(18).fill(3),
};

const celebData = {
  text_list: [
    "We must unite and harness our strengths, for the fate of our world hangs in the balance.",
    "However, if you choose to stay, know that the truth I unveil may forever alter the course of your journey.",
    "So here we are, trying to catch up, and hoping this day turns around soon.",
    "And sometimes, in both realms, it's not just about shining the brightest, but enduring the longest.",
    "But to those who knew her well, it was a symbol of her unwavering determination and spirit.",
    "We have the responsibility to ensure power and technology are used for the greater good.",
    "Our goal is to bridge communication gaps and preserve the richness of these unique languages.",
  ],

  path_template_list: [
    "audios/famous/optimusprime_{}.wav",
    "audios/famous/sherlock_{}.wav",
    "audios/famous/jessie_{}.wav",
    "audios/famous/caine_{}.wav",
    "audios/famous/rachel_{}.wav",
    "audios/famous/robert_{}.wav",
    "audios/famous/zuck_{}.wav",
  ],
  name_list: [
    "Optimus Prime",
    "Benedict Cumberbatch",
    "Jessie Eisenberg",
    "Michael Caine",
    "Rachel McAdams",
    "Robert Downey Jr.",
    "Mark Zuckerberg",
  ],
  prompt_text_list: [
    "Perhaps, in any case, we had better see some improvement, or this battle may be lost before it has truly begun.",
    "So maybe, that you would prefer to forgo my secret rather than consent to becoming a prisoner here for what might be several days.",
    "I'm starting this, twelve minutes late which is annoying and not my fault. Rachel needed my help and Ziggy would not stop crying.",
    "What you need to be a star in movies is not that different from what you need to be a star in the other universe. It just takes a little more luck.",
    "So far, the ordinary observer, an extraordinary observer might have seen that the chin was very pointed and pronounced. ",
    "They, say the best weapon is one you never have to fire. I respectfully disagree! I prefer, the weapon you only have to fire once! That's how dad did it! that's how America does it! and it's worked out pretty well so far.",
    "Alright so our team developed the first speech to speech AI translation system, that works for languages that are only spoken and not written like Hokkien.",
  ],
  // prompt_time: Array(7).fill(3),
  prompt_time: [8.731, 7.43, 6.873, 8.266, 7.152, 16.718, 8.638],
};

const animeData = {
  text_list: [
    "Let's go drink until we can't feel feelings anymore.",
    "Uh, it's not like the internet to go crazy about something small and stupid.",
    "Then I would never talk to that person about boa constrictors, or primeval forests, or stars. I would bring myself down to his level.",
    "In what a disgraceful light might it not strike so vain a man!",
  ],

  path_template_list: [
    "audios/anime/spongebob_{}.wav",
    "audios/anime/petergriffin_{}.wav",
    "audios/anime/rick_{}.wav",
    "audios/anime/morty_{}.wav",
  ],
  name_list: [
    "Sponge Bob",
    "Peter Griffin",
    "Rick",
    "Morty",
  ],
  prompt_text_list: [
    "My name is Spongebob Squarepants. And I’m gonna tell you about paying.",
    "Well, I, I’m getting something really special too and by special, I don’t mean special like that Kleinman boy down the street. More special, like, like special K the serial.",
    "Yeah, that’s the difference between you and me morty. I never go back to the carpet store.",
    "I’m being serious. Ok?",
  ],
  // prompt_time: Array(7).fill(3),
  prompt_time: [3.239, 9.850, 4.350, 1.750],
};

divBuilderCeleb("#celeb-box", celebData);
//divBuilder("#librispeech-box", librispeechData);
//divBuilder("#vctk-box", vctkData);
//divBuilderMLS("#mls-box", mlsData);
let librispeechFlag = false;
let mlsFlag = false;
let animeFlag = false;

document
  .querySelector(
    'button[data-bs-toggle="tab"][data-bs-target="#librispeech-box"]',
  )
  .addEventListener("shown.bs.tab", function (event) {
    if (!librispeechFlag) {
      librispeechFlag = true;
      divBuilderLibriSpeech("#librispeech-box", librispeechData);
    }
  });
document
  .querySelector('button[data-bs-toggle="tab"][data-bs-target="#mls-box"]')
  .addEventListener("shown.bs.tab", function (event) {
    if (!mlsFlag) {
      mlsFlag = true;
      divBuilderMLS("#mls-box", mlsData);
    }
  });
document
  .querySelector('button[data-bs-toggle="tab"][data-bs-target="#anime-box"]')
  .addEventListener("shown.bs.tab", function (event) {
    if (!animeFlag) {
      animeFlag = true;
      divBuilderAnime("#anime-box", animeData);
    }
  });

addEventListener("scroll", (event) => {
  if (document.querySelector("#myTab").offsetTop < window.scrollY) {
    document.querySelector("#fab").classList.add("show");
  } else {
    document.querySelector("#fab").classList.remove("show");
  }
});