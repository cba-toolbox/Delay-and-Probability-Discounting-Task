/**
 * task.js
 * jsPsych 7.0 ライブラリのフレームワークを用いて作成した
 * Delayed Discounting 課題を行うスクリプトです。
 * バージョン: 220124
 */

/*
無関心点 (IP) の調整手順の説明：

被験者が特定の試行で提示報酬額を選択した場合、それぞれの上限と下限は次の 3 つのルールに従って更新されます。
(1A) 提示報酬額が上限最小値未満の場合、上限最小値は提示報酬額に更新され、上限最大値は前の上限最小値に更新されます。
(1B) 提示報酬額が上限最小値以上の場合、上限最大値は提示報酬額に更新され、上限最小値は更新されません。
(1C) 提示報酬額が下限最小値よりも小さい場合、下限最小値は提示報酬額に更新されます。下限最小値は 0 に初期化されます。

被験者が特定の試行で標準報酬額を選択した場合、それぞれの上限と下限は次の 3 つのルールに従って更新されます。
(2A) 提示報酬額が下限最小値よりも大きい場合、下限最小値は提示報酬額に更新され、下限最大値は試行前の下限最小値に更新されます。
(2B) 提示報酬額が下限最小値以下の場合、下限最大値は提示報酬額に更新され、下限最小値は更新されません。
(2C) 提示報酬額が上限最小値よりも大きい場合、上限最小値は提示報酬額に更新され、上限最大値は「標準」値に初期化されます。

各上限と上限の差が 50 円以下に達すると、その提示報酬額が無関心点の推定値として記録されます。
特定の時間的または確率的遅延に対する無関心点が決定された場合、当該の試行はそれ以上実行されません。 

上限最大値、上限最小値、下限最大値、下限最小値の定義は以下の通りです。
(1) 上限最大値 (tmax)、上限最小値 (tmin)
  無関心点の範囲の上限を表します。tmin <= tmax の関係が成立します。
(2) 下限最大値 (bmax)、下限最小値 (bmin)
  無関心点の範囲の下限を表します。bmax <= bmin の関係が成立します。
  (大小関係が逆転していますので注意してください。)
*/

////////////////////////////////////////
//// 課題の設定

/**
 * ユーザー定義設定を取得します。
 * ユーザー定義設定を変更する場合はこの関数内で行ってください。
 */
const getUserDefinedSettings = () => ({

  /**
   * 試行終了後の待機時間を指定します。単位は「ミリ秒」です。
   */
  posttrialDelay: 500,

  /**
   * 妨害課題の開始タイミングです。
   * 試行回数が設定値を超えると 2 回に 1 回妨害課題が実行されます。
   */
  distractorStart: 70,

  /**
   * 標準報酬を定義します。単位は「円」です。
   */
  standard: 1000,

  /**
   * 提示する報酬額の刻み幅です。単位は「円」です。
   */
  step: 50,

  /**
   * 遅延時間の候補を定義します。単位は「日」です。
   */
  temporalDelays: [0, 2, 30, 180, 365],

  /**
   * 不確定性の候補を報酬獲得確率として定義します。単位は「%」です。
   */
  probabilities: [100, 90, 75, 50, 25],

  /**
   * 1 試行あたりの最大試行回数を定義します。
   */
  maximumTrialCount: 30,

  stimuli: {
    /**
     * 時間遅延試験の刺激文字列を定義します。
     */
    temporalDelay: (values) =>
      `(A) ${values.var} 円をいますぐに受け取る。 (B) ${values.std} 円を ${values.t} 日以内に受け取る。`,

    /**
     * 不確定性試験の刺激文字列を定義します。
     */
    probabilityDelay: (values) =>
      `(A) ${values.var} 円を確実に受け取る。 (B) ${values.std} 円を ${values.p}% の確率で受け取る。`,
  },
});


////////////////////////////////////////
//// 課題の構成

/**
 * 課題のタイムラインを生成します。
 * @returns 課題のタイムライン
 */
const prepareTimeline = () => {
  // 設定を読み込みます。
  const settings = prepareSettings();

  return [
    // フルスクリーン表示に切り替えます。
    setFullScreen(),

    // 課題の説明文を表示します。
    showTaskInstruction(),

    // 課題を行います。
    doDelaiedDiscountingTask(settings),

    // すべての試行が終了したら報酬試行を実施します。
    payoffTrial(settings),

    // 結果のサマリーを保存します。
    saveSummary(settings),

    // 課題の終了文を表示します。
    showEndInstruction(),

    // フルスクリーン表示を解除します。
    cancelFullScreen(),
  ];
};


////////////////////////////////////////
//// 課題の構成要素

/**
 * 画面をフルスクリーン表示に切り替えます。
 * @returns 試行オブジェクト
 */
const setFullScreen = () => {
  // jspsych_init.js スクリプトで fullscreen 全画面表示オブジェクトがすでに
  // 定義されている場合は、それを返します。そうで無い場合は新規に生成して返します。
  if (typeof fullscreen !== 'undefined') {
    return fullscreen;
  } else {
    return {
      type: jsPsychFullscreen,
      message: "<p><span style='font-size:20pt;'>それでは課題をはじめます。</span></p>" +
               "<p><span style='font-size:20pt;'>以下の「開始」を押すと，全画面になって課題がはじまります。</span></p>" + 
               "<p><span style='font-size:20pt;'>課題を途中で終了する場合は、エスケープ キーを押して全画面を解除し、</span></p>" + 
               "<p><span style='font-size:20pt;'>ブラウザーを閉じてください。</span></p>",
      button_label: "<p style='font-size:20px'>開始</p>",
      fullscreen_mode: true,
    };
  }
};

/**
 * マウス カーソルの表示/非表示状態を設定するブロック定義を生成します。
 * @param {boolean} visibility 表示/非表示状態
 * @returns ブロック定義
 */
const setCursorVisibility = (visibility) => ({
  type: jsPsychCallFunction,
  func: () => {
    document.body.style.cursor = visibility ? 'auto' : 'none';
  }
});

/**
 * 課題の説明文を表示するブロック定義を生成します。
 * @returns ブロック定義
 */
const showTaskInstruction = () => ({
  type: jsPsychInstructions,
  pages: [
    // 1 ページ目
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    'これから、様々な金額の報酬を、いくらかの遅延の後、あるいはいくらかの確率で受け取ることが出来る' +
    '選択の機会が与えられます。<br>' +
    'このテストは、約 110 個の以下に示すような質問で構成されています。</p>' +
    '<p style="font-size: 22px;">「今すぐに 200 円を受け取るか、30日後に 1000 円を受け取るか」</p>' +
    '<p style="font-size: 22px;">あるいは、</p>' +
    '<p style="font-size: 22px;">「確実に 500 円を受け取るか、25％ の確率で 1000 円を受け取るか」</p>' +
    '<p style="font-size: 16px; line-height: 3.6em;">[続行]をクリックして、次のページを表示してください。</p>',

    // 2 ページ目
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    'この課題が終わったら、あなたが解答した質問の中からランダムに 1 つの質問が選択されますので、' +
    'そこで選択したものを報酬として受け取ります。</p>' +
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    '・<u>すぐに報酬を受け取る選択肢</u>を選択した場合、この課題の終了時に現金でその金額を受け取ることができます。</p>' +
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    '・<u>受け取りに遅延を伴う選択肢</u>を選択した場合、そのお金はあなたの名前が書かれた封筒に入れられ、' +
    '時間が経過すると受け取ることができます。</p>' +
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    '・<u>確率的に報酬を受け取る選択肢</u>を選択した場合は、確率を反映した比率でそのお金を受け取ることが出来ます。<br>' +
    '　例えば選択した選択肢が「25％の確率で 1000 円を受け取る」だった場合、1000円を25%の確率で受け取ることができ、' +
    '75%の確率で0円となります。</p>' +
    '<p style="font-size: 16px; line-height: 3.6em;">[続行]をクリックすると、課題が開始されます。</p>',
  ],
  button_label_next: '続行',
  button_label_previous: '戻る',
  post_trial_gap: 500,
  show_clickable_nav: true,
});

/**
 * 一連の Delaied Discounting 課題を表すブロック定義を生成します。
 * @param {object} settings 設定オブジェクト
 * @returns ブロック定義
 */
const doDelaiedDiscountingTask = (settings) => {

  // 試行シーケンスを生成します。
  const trialSequence = prepareTrialSequence(settings);

  // ブロック定義として返します。
  return {
    timeline: [skipIfIpDetermined(delaiedDiscountingTrial(), distractorTrial())],
    timeline_variables: trialSequence,
  }
};

/**
 * 無関心点が見つかっている場合に試行をスキップするためのラッパーです。
 * @param  {...object} trials ブロック定義
 * @returns ブロック定義
 */
const skipIfIpDetermined = (...trials) => ({
  timeline: trials,
  conditional_function: () => {
    const trialName = jsPsych.timelineVariable('tiral_name');
    const settings = jsPsych.timelineVariable('settings');
    return settings.parameters[trialName].ip === undefined;
  }
});

/**
 * 1 回の Delaied Discounting 試行を表すブロック定義を生成します。
 * @returns Delaied Discounting 試行を表すブロック定義
 */
const delaiedDiscountingTrial = () => ({
  type: jsPsychHtmlButtonResponse,
  stimulus: '',
  choices: ['A', 'B'],
  margin_vertical: '100px',
  margin_horizontal: '80px',
  button_html: '<button class="trial-button">%choice%</button>',
  data: {
    name: 'delaied_discounting',
    tiral_name: jsPsych.timelineVariable('tiral_name'),
  },
  on_start: handleOnDelaiedDiscountingStart,
  on_finish: handleOnDelaiedDiscountingFinish,
});

/**
 * 1 回の妨害試行を表すブロック定義を生成します。
 * @returns 妨害試行を表すブロック定義
 */
const distractorTrial = () => ({
  timeline: [{
    type: jsPsychHtmlButtonResponse,
    stimulus: '',
    choices: ['A', 'B'],
    margin_vertical: '100px',
    margin_horizontal: '80px',
    button_html: '<button class="trial-button">%choice%</button>',
    data: {
      name: 'distractor',
      tiral_name: 'd0',
    },
    on_start: handleOnDistractorStart,
    on_finish: (data) => saveData(data, jsPsych.timelineVariable('settings')),
  }],
  conditional_function: () => {
    const settings = jsPsych.timelineVariable('settings');
    return settings.distractorStart <= settings.variables.count;
  }
});

/**
 * 報酬試行を表すブロック定義を生成します。
 * @param {object} settings 設定オブジェクト
 * @returns 妨害試行を表すブロック定義
 */
const payoffTrial = (settings) => ({
    type: jsPsychHtmlButtonResponse,
    post_trial_gap: settings.posttrialDelay,
    stimulus: '',
    choices: ['A', 'B'],
    margin_vertical: '100px',
    margin_horizontal: '80px',
    button_html: '<button class="trial-button">%choice%</button>',
    data: {
      name: 'payoff',
      reword: () => settings.variables.reword,
      choices: () => settings.variables.stimulus,
    },
    on_start: (trial) => handleOnPayoffStart(trial, settings),
    on_finish: (data) => saveData(data, settings),
});

/**
 * 結果オブジェクトにサマリー情報を記録するブロック定義を生成します。
 * @param {object} settings 設定オブジェクト
 * @returns ブロック定義
 */
const saveSummary = (settings) => ({
  type: jsPsychCallFunction,
  func: () => {},
  data: {
      name: 'save_summary',
  },
  on_finish: (data) => {
    data.summary = {
      total_trial_count: settings.variables.count,
      number_of_ips: settings.variables.number_of_ips,
      trial_parameters: settings.parameters,
    };
  },
});

/**
 * 課題の終了文を表示するブロック定義を生成します。
 * @returns 課題の終了文表示を表すブロック定義
 */
const showEndInstruction = () => ({
  type: jsPsychInstructions,
  pages: [
    '<p style="font-size: 22px; line-height: 1.8em; text-align: left; width: 800px;">' +
    '課題は終了しました。終了ボタンをクリックすると、結果が保存されて課題画面が消えます。' +
    'その後、ブラウザーを閉じてください。<br>ご参加、ありがとうございました。</p>',
  ],
  button_label_next: '終了',
  button_label_previous: '戻る',
  show_clickable_nav: true,
});

/**
 * 画面のフルスクリーン表示を解除します。
 * @returns ブロック定義
 */
const cancelFullScreen = () => ({
  type: jsPsychFullscreen,
  fullscreen_mode: false,
});

////////////////////////////////////////
//// 関数の定義

/**
 * 設定情報を格納したオブジェクトを生成します。
 * @returns 設定オブジェクト
 */
 const prepareSettings = () => {

  // ユーザー定義の設定を取得します。
  const {
    temporalDelays,
    probabilities,
    ...userSettings
  } = getUserDefinedSettings();

  // 各試行のパラメーターを生成します。
  const trialParameters = [
    ...temporalDelays.map((val, idx) => ({
      name: `t${idx + 1}`,
      type: 'temporal_delay',
      temporal_delay: val,
      count: 0,
      tmin: userSettings.standard,
      tmax: userSettings.standard,
      bmin: 0,
      bmax: 0,
      ip: undefined,
    })),
    ...probabilities.map((val, idx) => ({
      name: `p${idx + 1}`,
      type: 'probability_delay',
      probability: val,
      count: 0,
      tmin: userSettings.standard,
      tmax: userSettings.standard,
      bmin: 0,
      bmax: 0,
      ip: undefined,
    })),
    {
      name: 'd0',
      type: 'distractor',
      count: 0,
    },
  ];

  // 各試行のパラメーターを連想配列にまとめます。
  const parametersMap = {};
  trialParameters.forEach((trial) => { parametersMap[trial.name] = trial; });
  
  // 設定オブジェクトを作成して返します。
  return {
    ...userSettings,
    variables: {
      count: 0,
      reword: 0,
      stimulus: '',
      number_of_ips: 0,
    },
    threshold: userSettings.step,
    parameters: parametersMap,
  };
}

/**
 * 各試行をランダムに最大試行回数繰り返す配列を生成します。
 * @param {object} settings 設定オブジェクト
 * @returns 試行情報の配列
 */
const prepareTrialSequence = (settings) => {
  // 妨害課題以外の試行名を配列として取得します。
  const trialNames = Object.keys(settings.parameters).filter((key) => key !== 'd0');

  // タイムライン変数に格納するオブジェクトを生成します。
  const trialInformations = trialNames.map((trialName) => ({
    tiral_name: trialName,
    settings: settings
  }));

  // 各試行が反復回数分ずつ含まれるシーケンスを生成してシャッフルします。
  const repeatedArray = jsPsych.randomization.repeat(trialInformations, settings.maximumTrialCount);
  return jsPsych.randomization.shuffleNoRepeats(repeatedArray, (a, b) => a.tiral_name === b.tiral_name);
};

/**
 * 提示する報酬額を取得します。
 * @param {object} parameters 試行パラメーター
 * @param {object} step 報酬額の刻み幅
 * @returns 報酬額
 */
const getRewardValue = (parameters, step) => {
  const tmax = parameters.tmax / step;
  const bmax = parameters.bmax / step;
  return Math.round(Math.random() * (tmax - bmax) + bmax) * step;
};

/**
 * 刺激文字列を生成します。
 * @param {object} settings 設定オブジェクト
 * @param {string} trialName 試行名
 */
const getStimulousString = (settings, trialName) => {
  const parameters = settings.parameters[trialName];
  
  if (parameters.type === 'temporal_delay') {
    const values = {
      var: settings.variables.reword,
      std: settings.standard,
      t: parameters.temporal_delay
    };
    return settings.stimuli.temporalDelay(values)
  } else if (parameters.type === 'probability_delay'){
    const values = {
      var: settings.variables.reword,
      std: settings.standard,
      p: parameters.probability
    };
    return settings.stimuli.probabilityDelay(values);
  } else{
    return undefined;
  }
};

/**
 * 試行パラメーターを更新します。
 * @param {str} response 被験者のレスポンス
 * @param {number} reword 提示した報酬額
 * @param {object} parameters パラメーター オブジェクト
 * @param {number} standard 標準報酬額
 * @param {number} threshold 無関心点の決定閾値
 */
const updateParameters = (response, reword, parameters, standard, threshold) => {
  switch (response) {
    case 'A':
      if(reword < parameters.bmin) {
        // 条件 (1C) に相当します。
        parameters.bmax = 0; 
        parameters.bmin = reword;
      } else if (reword <= parameters.tmin) {
        // 条件 (1B) に相当します。
        parameters.tmax = parameters.tmin; 
        parameters.tmin = reword;
      } else {
        // 条件 (1A) に相当します。
        parameters.tmax = reword;
      }
      break;
    case 'B':
      if (parameters.tmin < reword) {
        // 条件 (2C) に相当します。
        parameters.tmax = standard; 
        parameters.tmin = reword;
      } else if (parameters.bmin < reword) {
        // 条件 (2A) に相当します。
        parameters.bmax = parameters.bmin; 
        parameters.bmin = reword;
      } else {
        // 条件 (2B) に相当します。
        parameters.bmax = reword;
      }
      break;
    default:
      // 通常ここには到達しません。
      console.log(`不正なレスポンスが与えられました。(response: ${response})`)
      return;
  }
	
  // 無関心点が決定された場合は値をパラメーターに格納します。
	if (parameters.tmax - parameters.bmax <= threshold) {
		parameters.ip = reword; 
	}
};


/**
 * Delaied Discounting 試行開始時に呼び出されるコールバック関数です。
 * 提示報酬額を決定して刺激を生成します。
 * @param {object} trial ブロック定義
 */
const handleOnDelaiedDiscountingStart = (trial) => {
  // 必要なパラメーターを取得します。
  const settings = jsPsych.timelineVariable('settings');
  const trialName = jsPsych.timelineVariable('tiral_name');
  const parameters = settings.parameters[trialName];

  // 試行回数のカウンタをインクリメントします。
  settings.variables.count++;
  parameters.count++;

  // 現在の状態に応じた提示額を取得します。
  settings.variables.reword = getRewardValue(parameters, settings.step);

  // 刺激文字列を生成します。
  settings.variables.stimulus = getStimulousString(settings, trialName);

  // 刺激を設定します。
  trial.stimulus =
    '<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">あなたはどちらを選びますか</p>' +
    `<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">${settings.variables.stimulus}</p>`;

  // トライアル後のディレイを設定します。
  trial.post_trial_gap = settings.posttrialDelay;
};

/**
 * Delaied Discounting 試行終了時に呼び出されるコールバック関数です。
 * 試行パラメーターを更新します。
 * @param {object} data 試行の結果データ コレクション
 */
const handleOnDelaiedDiscountingFinish = (data) => {
  // 必要なパラメーターを取得します。
  const settings = jsPsych.timelineVariable('settings');
  const response = data.response === 0 ? 'A' :
                   data.response === 1 ? 'B' :
                   String(data.response);
  const value = settings.variables.reword;
  const parameters = settings.parameters[data.tiral_name];
  const standard = settings.standard;
  const threshold = settings.threshold;

  // 試行パラメーターを更新します。
  updateParameters(response, value, parameters, standard, threshold);

  // 無関心点が見つかった場合は number_of_ips プロパティを更新します。
  if (parameters.ip !== undefined) {
    settings.variables.number_of_ips++;
  }

  // データを保存します。
  saveData(data, settings, parameters);
};

/**
 * 妨害課題の試行開始時に呼び出されるコールバック関数です。
 * 提示報酬額を決定して刺激を生成します。
 * @param {object} trial ブロック定義
 */
const handleOnDistractorStart = (trial) => {
  // 必要なパラメーターを取得します。
  const settings = jsPsych.timelineVariable('settings');
  const lastTrialName = jsPsych.timelineVariable('tiral_name');
  const trialType =
    settings.parameters[lastTrialName].type === 'temporal_delay' ? 'probability_delay' :
    settings.parameters[lastTrialName].type === 'probability_delay' ? 'temporal_delay' :
    settings.parameters[lastTrialName].type;
  const trialName = jsPsych.randomization.sampleWithReplacement(
    Object.values(settings.parameters).filter((parameters) => parameters.type === trialType), 1)[0].name;

  // 試行回数のカウンタをインクリメントします。
  settings.parameters['d0'].count++;

  // ダミーの提示額を生成します。
  settings.variables.reword = getRewardValue({ tmax: settings.standard, bmax: 0 }, settings.step);

  // 刺激文字列を生成します。
  settings.variables.stimulus = getStimulousString(settings, trialName);

  // 刺激を設定します。
  trial.stimulus =
    '<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">あなたはどちらを選びますか</p>' +
    `<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">${settings.variables.stimulus}</p>`;

  // トライアル後のディレイを設定します。
  trial.post_trial_gap = settings.posttrialDelay;
};

/**
 * 報酬試行開始時に呼び出されるコールバック関数です。
 * 被験者がこれまでに回答した質問の中からランダムに質問を選択し、
 * 刺激を生成します。
 * @param {object} trial ブロック定義
 * @param {object} settings 設定オブジェクト
 */
const handleOnPayoffStart = (trial, settings) => {
  // 必要なパラメーターを取得します。
  const trialResults = jsPsych.data.get().values().filter((result) => result.name === 'delaied_discounting');
  const selectedResult = jsPsych.randomization.sampleWithReplacement(trialResults, 1)[0];
  settings.variables.reword = selectedResult.reword;
  settings.variables.stimulus = selectedResult.choices;

  // 刺激を設定します。
  trial.stimulus =
    '<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">あなたはどちらを選びますか</p>' +
    `<p style="font-size: 24px; font-weight: bold; line-height: 1.4em;">${settings.variables.stimulus}</p>`;
};

/**
 * データをコレクションに保存します。
 * @param {object} data データ コレクション
 * @param {object} settings 設定オブジェクト
 * @param {object} parameters 試行パラメーター
 */
const saveData = (data, settings, parameters) => {
  if (!data) return;

  // データを保存します。
  if (settings?.variables) {
    data.reword = settings.variables.reword;
    data.choices = settings.variables.stimulus;
  }
  if (parameters) data.trial_parameters = {...parameters};
};

////////////////////////////////////////
//// 課題の実行

/**
 * 課題シーケンスです。
 * timeline 変数をグローバルに定義することにより、
 * jsPsych が定義された課題シーケンスを実行します。
 */
var timeline = prepareTimeline();

