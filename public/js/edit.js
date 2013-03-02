/*
 *Scoreの追加・音符の描画・データの保存を行う
*/

/*変数　とりあえずは即時で包まずにグローバルにしておく*/
var stage, canvas;
var SoundManager = {}, playing = false, recoding = false, handle;
var bpm = 120, lineMaxIndex = [], lmi = 0, lineIndexes;//lineMaxIndexのindex
var playHead, rectContainer, scoreTitle = "No Title";
var snappedLine, thisId, isNew;
var titleDom;
var AllScores = [], csi = 0; //Current Score Index;
var AllOptions = [];
var Sounds = new Array(8);
var setButtonEvent;

/*編集画面の初期化（ボタン/Stageの配置)*/
require(["dojo/query","dojo/dom-construct","dojo/dom","dojo/dom-attr","dojo/dom-class","dojo/on","dojo/domReady!"],
    function(query,domConst,dom,domAttr,domClass,on){
    var secEdit = dom.byId("section_edit");
    
    canvas = domConst.create("canvas",{
                width: 831, height: 150, class:"scoreCanvas"
                },dom.byId("canvasArea"));
    stage = new createjs.Stage(canvas);
    
    /*スコアが追加されると呼ばれる
    var scoreHandle = resultScore.observe(function(object,removedFrom,insertedInto){
        noteMemory = new Observable(new Memory({data:object.Note, idProperty:object.id}));
        var resultNote = noteMemory.query();
    });*/
    
    //init();
    
    var playBtn = dom.byId("btn_play"),
            stopBtn = dom.byId("btn_stop");
        
    setButtonEvent = function(){
        
        /*bpm 変更される度にグローバル変数bpmをリセット*/
        var domBpm = dom.byId("bpmNumber");
        on(domBpm,"change",function(){
            bpm = domBpm.value;
            if(bpm <= 0 || !bpm){
                bpm = 120;
                domBpm.value = 120;
            }else if(bpm > 300){
                bpm = 300;
                domBpm.value = 300;
            }
        });    
            
        
        on(playBtn,"click",function(e){
            
            domClass.toggle(playBtn,"playing");
            
            createjs.Sound.setMute(false);
            
            saveNotes();
            scrollHead();
            
            if(recoding){
                handle.remove();
                handle = null;
                recoding = false;
            }
            
        });
        
        on(stopBtn,"click",function(e){
            
            lineIndexes = {
                0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
            };
            
            csi = 0;
            playHead.x = 55;
            playHead.y = 0;
            
            domClass.toggle(playBtn,"playing",false);
            
            if(playing)
                scrollHead();
                
            if(recoding){
                handle.remove();
                handle = null;
                recoding = false;
            }
            
            saveNotes();    
            stage.update();
        });
        
        on(dom.byId("btn_record"),"click",function(e){
            
            if(!handle && !playing){
                /*count間の長さ(=delayの長さ)*/
                var delay = 100/bpm * 710, count = 0;
                /*countを鳴らす*/
                var cid = setInterval(function(){
                    if(count >= 4)
                        countEnded();
                    else{
                        Sounds[7].play();
                        count++;
                    }
                },delay);
                
                
                
                //setTimeout(function(){
                function countEnded(){
                    
                    clearInterval(cid);
                    cid = null;
                    
                    on.emit(playBtn,"click",e);
                            
                    handle = query("#drumset > span").on("click",function(e){
                        var yPos;
                        switch(e.target.id){
                            case "snear_drum":
                                yPos = rectContainer.getChildAt(4).y + 7.5;
                                lineMaxIndex[csi][3]++;
                                lineIndexes[3]++;
                                Sounds[3].play();
                                break;
                            case "floor_drum":
                                yPos = rectContainer.getChildAt(5).y + 7.5;
                                lineMaxIndex[csi][4]++;
                                lineIndexes[4]++;
                                Sounds[4].play();
                                break;
                            case "high_hut":
                                yPos = rectContainer.getChildAt(2).y + 7.5;
                                lineMaxIndex[csi][1]++;
                                lineIndexes[1]++;
                                Sounds[1].play();
                                break;
                            case "high_tum":
                            case "low_tum":
                                yPos = rectContainer.getChildAt(3).y + 7.5;
                                lineMaxIndex[csi][2]++;
                                lineIndexes[2]++;
                                Sounds[2].play();
                                break;
                            case "bass_drum":
                                yPos = rectContainer.getChildAt(6).y + 7.5;
                                lineMaxIndex[csi][5]++;
                                lineIndexes[5]++;
                                Sounds[5].play();
                                break;
                            case "simbul":
                                yPos = rectContainer.getChildAt(1).y + 7.5;
                                lineMaxIndex[csi][0]++;
                                lineIndexes[0]++;
                                Sounds[0].play();
                                break;
                        }
                        yPos += csi*120;
                        createNote({stageX: playHead.x, 
                                    stageY: yPos,
                                    context: AllScores[csi]
                        });/*switchここまで*/
                    }); 
                    
                    recoding = true;
                }
                //},1000);/*setTimeoutここまで*/
                
            }else{
                
                on.emit(playBtn,"click",e);
                
                /*handle.remove();
                handle = null;
                recoding = false;*/
            }    
        });
    };
    
    /*Titleテキスト*/
    
    titleDom = dom.byId("scoreTitle");
    on(titleDom,"click",function(e){
        if(domAttr.get(this,"value") == "No Title")
            domAttr.set(this,"value","");
    });
    on(titleDom,"change",function(e){
        var title = domAttr.get(this,"value");
        if(title == "")
            domAttr.set(this,"value","No Title");
        else if(title.length > 8)
            this.style.width = title.length*18 + "px";
        
        scoreTitle = this.value;
    });
    
    /*スニペット*/
    query(".command").on("click",function(e){
        
        var commandName = this.id;
        
        /*チェックされている項目を確認*/
        var divBar = dom.byId("bar_check"),
            divRow = dom.byId("row_check"),
            checkedBar = [], checkedRow = [];

        query("input",divBar).map(function(elm){
            if(elm.checked)
                checkedBar.push(elm.value);
        });
        query("input",divRow).map(function(elm){
            if(elm.checked)
                checkedRow.push(elm.nextSibling.textContent);
        });
        
        for(var r=0; r<checkedRow.length; r++){            
            
            var rowNo = +checkedRow[r];//1から始まるスコア行
            /*rowが存在すれば*/
            if(rowNo <= AllScores.length){
                
                /*各小節でループ*/
                for(var b=0; b<checkedBar.length; b++){
                
                    var i, barNo = +checkedBar[b]-1;
                    /*ハイハットy*/
                    var hihatPos = rectContainer.getChildAt(2).y + 7.5;
                        //lineMaxIndex[csi][1]++;
                        //lineIndexes[1]++;
                    hihatPos += 120 * (rowNo-1);
                    
                    /*スネアy*/
                    var snarePos = rectContainer.getChildAt(4).y + 7.5;
                        //lineMaxIndex[csi][3]++;
                        //lineIndexes[3]++;
                    snarePos += 120 * (rowNo-1);
                    
                    /*バスy*/
                    var bassPos = rectContainer.getChildAt(6).y + 7.5;
                        //lineMaxIndex[csi][5]++;
                        //lineIndexes[5]++;
                    bassPos += 120 * (rowNo-1);
                    
                    /*適当なところで打っていく*/  
                    for(i=0; i<8; i++){
                        /*メモ：第1小節第1分線は76.3px*/
                        /*スニペットを増やす時はここから！書式はだいたい同じ*/
                        switch(commandName){
                            case "8simple":
                                /*hihatは8分すべてで打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                });
                                                                
                                /*bassは1,5,6分で打つ*/
                                if(i == 0 || i == 4 || i == 5){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                              stageY: bassPos,
                                              context: AllScores[rowNo-1]
                                    });
                                }
                                
                                /*snareは3,7分で打つ*/
                                if(i == 2 || i == 6){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                            case "8fullkick":
                                /*hihatは8分すべてで打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                });
                                
                                /*bassも8分すべてで打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                        stageY: bassPos,
                                        context: AllScores[rowNo-1]
                                });
                                
                                /*snareは3,7分で打つ*/
                                if(i == 2 || i == 6){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                            case "blast":
                                /*hihatは8分すべてで打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                });
                                
                                /*bassは奇数分で打つ*/
                                if(i % 2 == 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: bassPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*snareは偶数分で打つ*/
                                if(i % 2 != 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                            case "down":
                                /*hihatは8分すべてで打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                });
                                
                                /*bassは偶数分で打つ*/
                                if(i % 2 != 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: bassPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*snareは奇数分で打つ*/
                                if(i % 2 == 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                            case "alternate":
                                /*bassは奇数分で打つ*/
                                if(i % 2 == 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: bassPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*snareは16分で打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                        stageY: snarePos,
                                        context: AllScores[rowNo-1]
                                });
                                createNote({stageX: 76 + 21.3*i + 10.7 + + 192*barNo, 
                                        stageY: snarePos,
                                        context: AllScores[rowNo-1]
                                });
                                break;
                            case "16beat":
                                /*hihatは16分(3,7は抜く)で打つ*/
                                if(i == 2 || i == 6){
                                    createNote({stageX: 76 + 21.3*i + 10.7 + + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }else{
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                    });
                                    createNote({stageX: 76 + 21.3*i + 10.7 + + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*bassは奇数分で打つ*/
                                if(i % 2 == 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: bassPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*snareは3,7分で打つ*/
                                if(i == 2 || i == 6){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                            case "metal":
                                /*hihatは偶数分で打つ*/
                                if(i % 2 != 0){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: hihatPos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                /*bassは16分で打つ*/
                                createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                        stageY: bassPos,
                                        context: AllScores[rowNo-1]
                                });
                                createNote({stageX: 76 + 21.3*i + 10.7 + + 192*barNo, 
                                        stageY: bassPos,
                                        context: AllScores[rowNo-1]
                                });
                                /*snareは3,7分で打つ*/
                                if(i == 2 || i == 6){
                                    createNote({stageX: 76 + 21.3*i + 192*barNo, 
                                            stageY: snarePos,
                                            context: AllScores[rowNo-1]
                                    });
                                }
                                break;
                        }
                    }
                
                }/*小節ループ終了*/
            }
        }/*スコア行ループ終了*/  
                   
        on.emit(stopBtn, "click", e);      
    });
    
    /*スニペット内、行番号を上下するボタン*/
    query(".snipet_button").on("click",function(e){
       
         var rowButtons = query("input","row_check"), k;
             
         switch(this.id){
            case "down_row":
                if(rowButtons[0].nextSibling.textContent != "1"){
                    for(k=0; k<8; k++){
                        rowButtons[k].nextSibling.textContent -= 8;
                    }
                }
                break;
            case "up_row":
                if(rowButtons[0].nextSibling.textContent <= 24){
                    for(k=0; k<8; k++){
                        rowButtons[k].nextSibling.textContent -= -8;
                    }
                }
                break;
        }
    });
    
});

/*edit
**引数は id, 新しいスコアかの真偽値の2つ*/
function edit(id, isnew){
    thisId = id;
    isNew = isnew
    libStage.enableMouseOver(0);//mouseoverを切る
    document.body.style.cursor = "";
    init();
}


function init(){
    
    /*再生ヘッド　全体を行き来する*/
    if(!playHead){
        playHead = new createjs.Shape();
        playHead.graphics.setStrokeStyle(1);
        playHead.graphics.beginStroke("#cf6060");
        playHead.graphics.beginFill("#cf6060");
        playHead.graphics.moveTo(0,20);
        playHead.graphics.lineTo(-10,10);
        playHead.graphics.lineTo(10,10);
        playHead.graphics.lineTo(0,20);
        playHead.graphics.lineTo(0,130);
        stage.addChild(playHead);
    }
    
    /*先頭位置に初期化*/
    playHead.x = 55;
    playHead.y = 0;
    
    /*マウスで自由に動かせるようにする(やめました)*/
    //playHead.onPress = onHeadPressed;
    
    /*再生ヘッドを動かして、各線上の最も小さいノートと衝突判定*/
    lineIndexes = {
        0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
    };
    
    SoundManager.tick = function(){
        
        /*先頭のわずかな空白を埋める*/
        if(playHead.x <= 55)
            playHead.x += 20;
        
        playHead.x += 2;

        /*小節間をつなぐ*/
        /*1小節192pxに到達したら次の小節に飛ばす*/
        if(playHead.x == 55 + 190 || 
           playHead.x == 55 + 380 || 
           playHead.x == 55 + 570 ){
            playHead.x += 22;
        }
        
        if(AllScores[csi].Notes){
          for(var i=AllScores[csi].Notes.length-1; i>=0; i--){
              var notes = AllScores[csi].Notes;
              for(var m=notes.length-1; m>=0; m--){
                  if(lineMaxIndex[csi][i] > lineIndexes[i]){
                      if(playHead.x-1 == notes[i][lineIndexes[i]].x ||
                          playHead.x == notes[i][lineIndexes[i]].x ||
                          playHead.x+1 == notes[i][lineIndexes[i]].x){
                          /*Soundを鳴らす*/
                          Sounds[i].play();
                          console.log("sound");
                          lineIndexes[i]++;
                      }
                  }
              }
          }
        }
        
        if(playHead.x > 810){
            if(AllScores.length-1 > csi){
                csi++;
                lineIndexes = {
                    0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0
                };
                playHead.x = 63;
                playHead.y += 120;
            }else{
                scrollHead();
            }
        }
        stage.update();
    };
    
    createScore();
    createSavedScore();
    
    //prepareSound();
    //loadRecordAnim();
}

function scrollHead(){
    if(playing)
        createjs.Ticker.removeListener(SoundManager);
    else{
        createjs.Ticker.useRAF = true;
        createjs.Ticker.setFPS(bpm/3);
        createjs.Ticker.addListener(SoundManager);
    }
    playing = !playing;
}  

function createScore(){
    /*一つ一つのスコア（横一列）を包むコンテナ*/
    var aScoreContainer = new createjs.Container();
    aScoreContainer.y = 15;
    stage.addChildAt(aScoreContainer,0);
    AllScores.push(aScoreContainer);
    
    
    /*lineMaxIndex(各音階の音符最大数-1)を
      スコアコンテナの分だけ拡張する*/
    lineMaxIndex[lmi++] = [];
    
    /*各コンテナに固有のノート配列*/
    aScoreContainer.Notes = [];
    /*Notes内を７つのコンテナに分割*/
    var i;
    for(i=0; i<7; i++){
        aScoreContainer.Notes[i] = [];
        /*ついでにlineMaxIndexも二次元配列にしとく*/

    }
    /*各コンテナに固有の四角領域*/
    aScoreContainer.Rects = [];
    /*各コンテナに固有の分割線*/
    aScoreContainer.Lines = [];
    
    if(scoreImg){
        imageLoaded();
    }else{
        var scoreImg = new Image();
        scoreImg.onload = imageLoaded;
        scoreImg.src = "images/a_score.png";
    }

    function imageLoaded(){
        var scoreBM = new createjs.Bitmap(scoreImg);
        aScoreContainer.addChildAt(scoreBM,0);
        
        /*音符を乗せる四角形を生成*/
        rectContainer = new createjs.Container();
        for(i=0; i<7; i++){
            var scoreRect = new createjs.Shape();
            scoreRect.graphics.beginFill("rgba(255,255,255,0.05)");
            scoreRect.graphics.drawRect(0,0,831,14);
            scoreRect.y = 9 + i*14;
            scoreRect.onPress = createNote;
            rectContainer.addChild(scoreRect);
            aScoreContainer.Rects.push(scoreRect);
        }
        
        /*分割線用のグラフィクス*/
        var lineGra = new createjs.Graphics();
        lineGra.setStrokeStyle(1.5);
        lineGra.beginStroke("#99f");
        lineGra.moveTo(0,0);
        lineGra.lineTo(0,120);
        /*4つの小節それぞれに8分割線を生成*/
        var lineContainer = new createjs.Container();
        
        for(i=0; i<4; i++){
            for(var j=0; j<8; j++){
                var splitLine = new createjs.Shape(lineGra);
                splitLine.alpha = 0.3;
                /*第1小節は55~247px = 192px/小節
                  9個に分割->192px/10 = 21.3px
                  55+21.3に一つ目、以降21.3pxずつ右にずらす*/
                splitLine.x = 55 + (i*192) + (j+1)*21.3;
                lineContainer.addChild(splitLine);
                aScoreContainer.Lines.push(splitLine);
            }
        }
        aScoreContainer.addChildAt(rectContainer,1);
        aScoreContainer.addChildAt(lineContainer,2);
        
        /*cacheする コメントアウトすると10倍ほど遅くなる*/
        aScoreContainer.cache(0,0,831,14*8);
    
        stage.update();
    }
    
    /*plus/minusボタン*/
    require(["dojo/dom","dojo/dom-construct","dojo/on"],function(dom,domConst,on){
        
        var optionArea = domConst.create("div",{ class:"option_area",
                                                 id:AllOptions.length },dom.byId("canvasArea"));
        optionArea.style.top = 40 + AllOptions.length*120 + "px";
        
        AllOptions.push(optionArea);
        
        var removeBtn = domConst.create("span",{ class:"btn_removeAScore",
                                                 id:"remove"+AllOptions.length },optionArea);
        var addBtn = domConst.create("span",{ class:"btn_addAScore",
                                              id:"add"+AllOptions.length },optionArea);
        
        /*横一列スコアの追加*/
        on(addBtn,"click",function(e){
            
            if(playing)
                return;
            
            addScore(e);
        
            stage.update();
        });
    
        /*横一列スコアの削除*/
        on(removeBtn,"click",function(e){
            
            if(playing)
                return;
            
            removeScore(e);
            
            stage.update();
        });
    });
}
    
function createNote(e){
    /*どのスコアコンテナを対象としているか contextの中身はaScoreContainer*/
    var context = (e.type=="onPress")? e.target.parent.parent: e.context;
    var note = new createjs.Shape();
    note.x = e.stageX;
    snapToNear(note,context);
    
    for(var r=context.Rects.length-1; r>=0; r--){
        var scoreRect = context.Rects[r];
        if(Math.abs(e.stageY-context.y - scoreRect.y-7.5) < 8){
            note.y = scoreRect.y + 7.5;
            /*r(=0から始まる音階)にノートを蓄積*/
            context.Notes[r].push(note);
            break;
        }
    }
        
    /*rの値からノートを書き分ける*/
    drawProperNote(note,r);
    note.onPress = onNotePressed;
    note.onDoubleClick = removeNote;
    context.addChild(note);
    /*↓これが重要！stage.update()だけではキャッシュまで更新されない!*/
    context.updateCache();
    
    stage.update();
    
    saveNotes();
};

function createSavedScore(){
    if(Scores[thisId] == undefined){
        Scores[thisId] = {};
        titleDom.value = "No Title";
    }else{
        /*セーブされているスコア分作成*/
        var maxScoreIndex = AllScores.length-1;
        
        /*セーブされているノートを作成*/
        var noteData = Scores[thisId].slice(1);//info(1番目)を除く
        for(var i=noteData.length-1; i>=0; i--){
            var aNote = noteData[i];//一つノート(x,y,ctx)
            
            if(aNote.ctx > maxScoreIndex){
                while(aNote.ctx != maxScoreIndex){ 
                    addScore();
                    maxScoreIndex++;
                }
            }
            
            createSavedNote({
                stageX: aNote.x,
                stageY: aNote.y,
                context: AllScores[aNote.ctx],
                r: ((aNote.y/14)>>0) - 1
            });
        }
        
        /*ついでにタイトルも設定*/
        titleDom.value = Scores[thisId][0].name;
    }
}

function createSavedNote(e){

        var note = new createjs.Shape();
        note.x = e.stageX;
        note.y = e.stageY;
        snapToNear(note,e.context); 
        
        drawProperNote(note,e.r);
        note.onPress = onNotePressed;
        note.onDoubleClick = removeNote;
        
        e.context.Notes[e.r].push(note);
        
        drawProperNote(note,e.r);
        note.onPress = onNotePressed;
        note.onDoubleClick = removeNote;
        
        e.context.addChild(note);
        stage.update();
}

function prepareSound(){
    var queue = new createjs.LoadQueue(true);
    createjs.Sound.setMute(true);
    createjs.Sound.setVolume(0);
    queue.addEventListener("complete", soundPrepared);
    queue.installPlugin(createjs.Sound);
    
    var manifest = [
        {src:"sounds/crash.wav", id:"crash"},
        {src:"sounds/hihat1.wav", id:"hihat"},
        {src:"sounds/tom.wav", id:"tom"},
        {src:"sounds/snare1.wav", id:"snare"},        
        {src:"sounds/floor.wav", id:"floor"},
        {src:"sounds/bass.wav", id:"bass"},
        /*{src:"sounds/ride1.wav", id:"ride"},*/
        {src:"sounds/stick.wav", id:"stick"}
    ];
    queue.loadManifest(manifest);
}
/* Defferdを使ったバージョン
function soundLoaded(e){
    require(["dojo/Deferred","dojo/dom"], function(Deferred,dom){
      
      var df = new Deferred();
      df.then(function(){
        setTimeout(function(){
          createjs.Sound.setMute(false);
          setButtonEvent();
          console.log(Sounds);
          
          dom.byId("loading_layer").style.display = "none";
        },2000);
      });
      
      Sounds[0] = createjs.Sound.play("crash");
      Sounds[1] = createjs.Sound.play("hihat");
      Sounds[2] = createjs.Sound.play("tom");
      Sounds[3] = createjs.Sound.play("snare");
      Sounds[4] = createjs.Sound.play("floor");
      Sounds[5] = createjs.Sound.play("bass");
      Sounds[6] = createjs.Sound.play("hihat");
      Sounds[7] = createjs.Sound.play("stick");
      
      var cid = setInterval(function(){
          console.log(e.target.loaded);
          if(e.target.loaded){
            
            df.resolve();
            clearInterval(cid);
          }
      }, 500);
    });
}*/

/*Defferdなしのバージョン*/
function soundPrepared(e){
    
    require(["dojo/dom","dojo/_base/fx","dojo/fx/easing"], function(dom, baseFx, easing){
      
      setButtonEvent();
      
      //loading_layerをはずす
      var loading_layer = dom.byId("loading_layer");
      baseFx.animateProperty({
          easing: easing.sinOut,
          duration: 300,
          node: loading_layer,
          properties: {
              opacity: 0
          },
          onEnd: function(){
            loading_layer.style.display = "none";
          }
      }).play();
      
      Sounds[0] = createjs.Sound.play("crash");
      Sounds[1] = createjs.Sound.play("hihat");
      Sounds[2] = createjs.Sound.play("tom");
      Sounds[3] = createjs.Sound.play("snare");
      Sounds[4] = createjs.Sound.play("floor");
      Sounds[5] = createjs.Sound.play("bass");
      Sounds[6] = createjs.Sound.play("hihat");
      Sounds[7] = createjs.Sound.play("stick");

    });
}

/**/
function addScore(targetScore){
    require(["dojo/dom","dojo/dom-attr"],function(dom,domAttr){
        /*ますHTMLセクションの高さを確保する*/
        var myScore = dom.byId("section_myScore");
        var newHeight = parseInt(myScore.style.height) + 200;
        myScore.style.height = newHeight + "px";
        
        /*同様にcanvas領域も高くする*/
        var canvasHeight = domAttr.get(canvas,"height");
        domAttr.set(canvas,"height",+canvasHeight+120);
        /*canvasを再設定*/
        stage.canvas = canvas;
        
        createScore();
            
        var scoreLength = AllScores.length;
        if(targetScore != undefined){
            /*idは個数目*/
            var id = targetScore.target.id.slice(3);
            AllScores[scoreLength-1].y += 120*(id);
            
            
            for(var i=id; i<scoreLength-1; i++){
                AllScores[i].y += 120;
            }
        }else{
            AllScores[AllScores.length-1].y += 120*(AllScores.length-1);
        }
        AllScores.sort(function(a,b){
            return a.y - b.y;
        });
    });
}
    
function removeScore(targetScore){
    require(["dojo/dom","dojo/dom-construct","dojo/dom-attr","dojo/query"],function(dom,domConst,domAttr,query){
        
        var id = targetScore.target.id.slice(6),
            max = AllScores.length;
        
        //lineMaxIndex[lmi--] = null;
        lineMaxIndex.splice(id-1, 1);
        lmi--;
          
        if(max <= 1)
            return;
        
        AllScores[id-1].removeAllChildren();
        stage.removeChild(AllScores[id-1]);
        AllScores[id-1] = null;
        AllScores.splice(id-1,1);
        
        /*plus/minusボタンの削除*/
        var optionsList = query(".option_area");
        domConst.destroy(optionsList[AllOptions.length-1]);
        AllOptions.splice(AllOptions.length-1,1);
        
        AllScores.sort(function(a,b){
            return a.y - b.y;
        });
        
        AllOptions.sort(function(a,b){
            return a.id - b.id;
        });
        
        for(var i=id-1,max = AllScores.length; i<max; i++){
            AllScores[i].y -= 120;
        }
        
        var canvasHeight = domAttr.get(canvas,"height");
        domAttr.set(canvas,"height",+canvasHeight-120);
        /*canvasを再設定*/
        stage.canvas = canvas;
        
        var myScore = dom.byId("section_myScore");
        var newHeight = parseInt(myScore.style.height) - 200;
        myScore.style.height = newHeight + "px"; 
    });
}
    
var hitAreaObj = new createjs.Shape();
hitAreaObj.graphics.beginFill("#fff");
hitAreaObj.graphics.drawRect(-7,-7,14,14);
function drawProperNote(shape,r){
    switch(r){
        case 2:
        case 3:
        case 4:
        case 5:
            shape.graphics.clear();
            shape.graphics.beginFill("#000");
            shape.graphics.drawEllipse(-6.5,-5,13,10);
            shape.rotation = -25;
            shape.hitArea = hitAreaObj;
            break;
        case 1:
        case 6:
            shape.graphics.clear();
            shape.graphics.setStrokeStyle(1.5);
            shape.graphics.beginStroke("#000");
            shape.graphics.moveTo(-5,-5);
            shape.graphics.lineTo(5,5);
            shape.graphics.moveTo(-5,5);
            shape.graphics.lineTo(5,-5);
            shape.rotation = 0;
            shape.hitArea = hitAreaObj;
            break;
        case 0:
            shape.graphics.clear();
            shape.graphics.beginFill("#000");
            shape.graphics.moveTo(-0.5,-6.5);
            shape.graphics.lineTo(-7,0);
            shape.graphics.lineTo(0.5,6.5);
            shape.graphics.lineTo(7,0.5);
            shape.graphics.endFill();
            shape.graphics.beginFill("#fff");
            shape.graphics.moveTo(-1,-4);
            shape.graphics.lineTo(-4,-1);
            shape.graphics.lineTo(1.5,4);
            shape.graphics.lineTo(4,1);
            shape.graphics.endFill();
            shape.rotation = 0;
            shape.hitArea = hitAreaObj;
            break;
    }
}
    
function onNotePressed(e){
    
    var context = e.target.parent;
    /*配列から削除するかどうかのフラグ*/
    e.target.delete = true;
    cleanUpNotes(context);
    
    e.onMouseMove = function(me){
        e.target.x = me.stageX;
        e.target.y = me.stageY - context.y;
        
        /*漸近の分割線にスナップ*/
        snapToNear(e.target,context);
        
        /*枠外に出ないようにする*/
        checkBounds(e.target);
        context.updateCache();
        stage.update();
    }
    e.onMouseUp = function(me){
        for(var r=context.Rects.length-1; r>=0; r--){
            var scoreRect = context.Rects[r];
            if(Math.abs(me.target.y - scoreRect.y-7) < 8){
                me.target.y = scoreRect.y + 7.5;
                /*r(=0から始まる音階)にノートを蓄積*/
                me.target.delete = false;
                context.Notes[r].push(me.target);
                break;
            }
        }
        
        drawProperNote(me.target,r);
        
        /*分割線のハイライトを消す*/
        if(snappedLine)
            snappedLine.alpha = 0.3;
        
        context.updateCache();
        stage.update();
        
        saveNotes();
    }
}

/*衝突判定の都合上、やめました*/
/*function onHeadPressed(e){
    e.onMouseMove = function(me){
        e.target.x = me.stageX;
        
        stage.update();
    }
}*/
    
function removeNote(e){
    /*flagを付ける*/
    this.delete = true;
    this.parent.removeChild(this);

    saveNotes();    
}

function loadRecordAnim(){
    var recordImg = new Image();
    recordImg.onload = recordImgLoaded;
    recordImg.src = "../../images/btn_record_sprite.png";
    
    function recordImgLoaded(){
        var recordSprite = new createjs.SpriteSheet({
            images: [recordImg],
            frames: {widht:133,height:134,regX:67,regY:67},
            animation: {record:[0,2,"record"]}
        });
        
        var bmpAnim = new createjs.BitmapAnimation(recordSprite);
        
    }
}

/*引数には対象のスコアコンテクストを取る*/
function cleanUpNotes(context){
    
    for(var n=context.Notes.length-1; n>=0; n--){
        for(var m=context.Notes[n].length-1; m>=0; m--){
            var theNote = context.Notes[n][m];
            /*deleteプロパティがtrueなら削除*/
            if(theNote.delete == true)
                context.Notes[n].splice(m,1);
            /*x値を整数にする*/
            else
                theNote.x = Math.round(theNote.x);
        }
    }
}

/*前半：x座標が小さい順にソートする
後半: 個々のスコアコンテナの7つの音階それぞれの音符数を取得*/
function sortAndSetMaxIndex(){      
    for(var s=AllScores.length-1; s>=0; s--){
        var Scontainer = AllScores[s];
        for(var i=Scontainer.Notes.length-1; i>=0; i--){
            Scontainer.Notes[i].sort(function(a,b){
                return a.x - b.x;
            });
            lineMaxIndex[s][i] = Scontainer.Notes[i].length;
        }
    }
}

/*引数には対象の音符とコンテクスト*/
function snapToNear(target,context){
    
    for(var l=context.Lines.length-1; l>=0; l--){
        var splitLine = context.Lines[l];
        if(Math.abs(target.x - splitLine.x) < 6){
            target.x = splitLine.x;
            splitLine.alpha = 1;
            snappedLine = splitLine;
            
        }
        else{
            splitLine.alpha = 0.3;
        }
    }
    
}
    
function checkBounds(target){
    //62 814 102 15
    if(target.x < 62)
        target.x = 62;
    else if(target.x > 814)
        target.x = 814;
    if(target.y < 15)
        target.y = 15;
    else if(target.y > 102)
        target.y = 102;
}

function saveNotes(){
    
    require(["dojo/json"],function(JSON){
        
        var storingNote = [{}], s;
        
        /*deleteフラグの音符の削除と、座標の整数化、保存する配列の作成*/
        for(s=AllScores.length-1; s>=0; s--){ 
            for(var n=AllScores[s].Notes.length-1; n>=0; n--){
                for(var m=AllScores[s].Notes[n].length-1; m>=0; m--){
                    var theNote = AllScores[s].Notes[n][m];
                    /*deleteプロパティがtrueなら削除*/
                    if(theNote.delete == true){
                        AllScores[s].Notes[n].splice(m,1);
                        
                        AllScores[s].updateCache();
                        stage.update();
                    }else{
                        theNote.x = Math.round(theNote.x);
                        //theNote.cache(theNote.width/2,theNote.height/2,
                        //            theNote.width,theNote.height);
                        storingNote.push({x:theNote.x, y:theNote.y, ctx:s});
                    }
                }
                try{
                  lineMaxIndex[s][n] = AllScores[s].Notes[n].length;
                }catch(error){
                  console.log(error);
                  return;
                }
            }
        }
        
        /*各譜面の各音階で、x座標が小さい順にソート また最大数の参照*/
        for(s=AllScores.length-1; s>=0; s--){
            var Scontainer = AllScores[s];
            for(var i=Scontainer.Notes.length-1; i>=0; i--){
                Scontainer.Notes[i].sort(function(a,b){
                    return a.x - b.x;
                });
                lineMaxIndex[s][i] = Scontainer.Notes[i].length;
            }
        }
        
        if(isCanvasSupported){

            if(!(typeof Scores == "object"))
                Scores = JSON.parse(Scores);
            var date = new Date(),
                dateStr = date.getFullYear()+"/"+parseInt(date.getMonth())+1+"/"+
                date.getDate()+"\n"+date.getHours()+":"+date.getMinutes();
            /*info(配列の1番目)の更新*/
            storingNote.splice(0,1,{name:titleDom.value,date:dateStr,id:thisId,i:lineMaxIndex});
            /*idからScoresの何番目にあるのかを探索*/
            /*idでソートされていない上、必ずしも連番で存在するわけではないため*/
            /*この処理が必要*/
            if(isNew){
                 Scores.splice(thisId,1,storingNote); /*新規スコアだったら {} と入れ替えるだけ*/
            }else{
                 for(s=0; s<Scores.length; s++){
                    if(Scores[s][0].id == thisId){
                        Scores.splice(s,1,storingNote);
                        break;
                    }
                }
            }
            Scores = JSON.stringify(Scores);
            localStorage.setItem("Scores",Scores);
        }
    });
    
}
