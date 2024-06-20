window.RevealWebcam = function () {
  var keyCodes = {
    backspace: 8, tab: 9, enter: 13, shift: 16, ctrl: 17, alt: 18, pausebreak: 19, capslock: 20,
    esc: 27, space: 32, pageup: 33, pagedown: 34, end: 35, home: 36, leftarrow: 37, uparrow: 38,
    rightarrow: 39, downarrow: 40, insert: 45, delete: 46, 0: 48, 1: 49, 2: 50, 3: 51, 4: 52,
    5: 53, 6: 54, 7: 55, 8: 56, 9: 57, a: 65, b: 66, c: 67, d: 68, e: 69, f: 70, g: 71, h: 72,
    i: 73, j: 74, k: 75, l: 76, m: 77, n: 78, o: 79, p: 80, q: 81, r: 82, s: 83, t: 84, u: 85,
    v: 86, w: 87, x: 88, y: 89, z: 90, leftwindowkey: 91, rightwindowkey: 92, selectkey: 93,
    numpad0: 96, numpad1: 97, numpad2: 98, numpad3: 99, numpad4: 100, numpad5: 101, numpad6: 102,
    numpad7: 103, numpad8: 104, numpad9: 105, multiply: 106, add: 107, subtract: 109, decimalpoint: 110,
    divide: 111, f1: 112, f2: 113, f3: 114, f4: 115, f5: 116, f6: 117, f7: 118, f8: 119, f9: 120,
    f10: 121, f11: 122, f12: 123, numlock: 144, scrolllock: 145, semicolon: 186, equalsign: 187,
    comma: 188, dash: 189, period: 190, forwardslash: 191, graveaccent: 192, openbracket: 219,
    backslash: 220, closebracket: 221, singlequote: 222
  };

  return {
    id: "RevealWebcam",
    init: function (deck) {
      // Learn more at https://revealjs.com/creating-plugins/
      const config = deck.getConfig().webcam || {};

      /**
      * obtain plugin path from the script element
      * @returns {string}
      * @memberOf EmbedVideo
      */
      var getScriptPath = function () {
        var path;
        var end = -('/webcam.js'.length);
        if (document.currentScript && document.currentScript['src']) {
          path = document.currentScript['src'].slice(0, end);
        } else {
          var scriptTag = document.querySelector('script[src$="/webcam.js"]');
          if (scriptTag) {
            path = scriptTag.src.slice(0, end);
          }
        }
        return path;
      };

      var options = config['embed-video'] || {};
      options.enabled = !!config.enabled; // enable live video (toggle with [C])
      options.persistent = !!config.persistent; // keep camera active if hidden
      options.path = config.path || getScriptPath() || 'plugin/webcam';
      
      options.toggleKey = config.toggleKey ? config.toggleKey.toLowerCase() : "c";
      options.toggleKeyCode = keyCodes[options.toggleKey] || 64;
      console.log(options)
      
      var LiveStream = function (video, persistent) {
        /**
         * @type {HTMLVideoElement}
         * @private
         */
        this._video = video;
        /**
         * @type {boolean}
         * @private
         */
        this._persistent = persistent;
        /**
         * @type {EmbedVideo.LiveStream.STATUS}
         * @private
         */
        this._status = LiveStream.STATUS.DISABLED;
        /**
         * @type {?(MediaStream|MediaSource|Blob|File)}
         * @private
         */
        this._stream = null;
        /**
         * @type {string[]}
         * @private
         */
        this._devices = null;
        /**
         * @type {?string}
         * @private
         */
        this._currentDeviceId = null;
      };

      
      LiveStream.STATUS = {
        DISABLED: 0,
        PENDING: 1,
        ACTIVE: 2,
        ERROR: -1
      };

      /**
       * Start streaming, activate an existing stream or create a new one.
       * If here is an active stream this call will do nothing.
       */
      LiveStream.prototype.start = function () {
        if (this._status === LiveStream.STATUS.DISABLED) {
          if (this._stream) {
            this._enable();
          } else {
            this._create();
          }
        }
      };

      /**
       * Check if the stream is active
       * @returns {boolean}
       */
      LiveStream.prototype.isActive = function () {
        return this._status === LiveStream.STATUS.ACTIVE;
      };

      /**
       * Stop video stream and disable video
       */
      LiveStream.prototype.stop = function () {
        if (this.isActive()) {
          this._disable();
        }
      };

      /**
       * Switch to the next video device
       */
      LiveStream.prototype.next = function () {
        var deviceId = null;
        if (
          this._devices instanceof Array &&
          this._devices.length > 1
        ) {
          deviceId = this._devices[0];
          if (this._currentDeviceId) {
            var index = this._devices.indexOf(this._currentDeviceId);
            if (index >= 0 && index + 1 < this._devices.length) {
              deviceId = this._devices[index + 1];
            }
          }
        }
        if (deviceId && deviceId !== this._currentDeviceId) {
          // noinspection JSUnusedGlobalSymbols
          this._currentDeviceId = deviceId;
          this._destroy();
          if (this.isActive()) {
            this._create();
          }
        }
      };

      /**
       * Activate video after Reveal is ready, wait with video activation until then
       * @private
       */
      LiveStream.prototype._enable = function () {
        var video;
        if (!deck.isReady()) {
          deck.addEventListener(
            'ready',
            /**
             * @this EmbedVideo.LiveStream
             */
            function () {
              this._enable()
            }.bind(this)
          );
        } else if (this._stream) {
          video = this._video;
          if (video.srcObject !== this._stream) {
            video.pause();
            video.srcObject = this._stream;
          }
          video.setAttribute('data-enabled', 'true');
          if (!video.playing) {
            video.play();
          }
          // noinspection JSUnusedGlobalSymbols
          this._status = LiveStream.STATUS.ACTIVE;
        }
      };

      /**
       * Fetch device list and create user media stream
       * @private
       */
      LiveStream.prototype._create = function () {
        var constraints = {
          audio: false,
          video: true
        };
        // noinspection JSUnusedGlobalSymbols
        this._status = LiveStream.STATUS.PENDING;
        if (null === this._devices) {
          // noinspection JSUnusedGlobalSymbols
          this._devices = [];
          navigator
            .mediaDevices
            .enumerateDevices()
            .then(
              /**
               * @param {Array.<MediaStream|MediaSource|Blob|File>} devices
               * @this EmbedVideo.LiveStream
               */
              function (devices) {
                for (var i = 0, c = devices.length; i < c; i++) {
                  if (devices[i].kind.toLowerCase() === 'videoinput') {
                    this._devices.push(devices[i].deviceId);
                  }
                }
              }.bind(this)
            );
        }
        if (this._currentDeviceId) {
          constraints.video = { deviceId: this._currentDeviceId };
        }
        navigator
          .mediaDevices
          .getUserMedia(constraints)
          .then(
            /**
             * @this EmbedVideo.LiveStream
             */
            function (stream) {
              this._stream = stream;
              this._currentDeviceId = stream.getVideoTracks()[0].getSettings().deviceId;
              this._enable();
            }.bind(this)
          )
          .catch(
            /**
             * @this EmbedVideo.LiveStream
             */
            function (error) {
              console.log('getUserMedia error: ', error);
              this._status = LiveStream.STATUS.ERROR;
            }.bind(this)
          );
      };

      /**
       * Pause video, remove enabled status and stop stream
       * @private
       */
      LiveStream.prototype._disable = function () {
        var video = this._video;
        if (video instanceof HTMLVideoElement) {
          if (video.playing) {
            video.pause();
          }
          video.srcObject = null;
          video.removeAttribute('data-enabled');
          video.load();
          if (!this._persistent) {
            this._destroy();
          }
        }
        // noinspection JSUnusedGlobalSymbols
        this._status = LiveStream.STATUS.DISABLED;
      };

      /**
       * @private
       */
      LiveStream.prototype._destroy = function () {
        if (this._stream) {
          this._stream.getTracks().forEach(
            function (track) {
              track.stop();
            }
          );
          // noinspection JSUnusedGlobalSymbols
          this._stream = null;
        }
      };

      /**
 * @param {EmbedVideo.Plugin.Options} options
 * @constructor
 * @memberOf EmbedVideo
 */
      var Plugin = function (options) {
        var style;
        var _isEnabled = options.enabled;

        /**
         * is video the video display enabled
         * @returns {boolean}
         */
        this.isEnabled = function () {
          return _isEnabled;
        };

        /**
         * enabled/disable the video display
         * @method
         * @returns {boolean}
         */
        this.toggle = function () {
          _isEnabled = !_isEnabled;
          this.update();
          return _isEnabled;
        }.bind(this);

        /**
         * CSS class to identify the video element (avoid conflicts with other videos)
         * @type {string}
         * @private
         */
        this._identfierClass = 'live-video';
        /**
         * @type {HTMLVideoElement}
         * @private
         */
        this._video = document.querySelector('.reveal').appendChild(
          document.createElement('video')
        );
        this._video.setAttribute('class', this._identfierClass);
        this._video.addEventListener(
          'click',
          /**
           * @this EmbedVideo.Plugin
           */
          function () {
            this._stream.next();
          }.bind(this)
        );
        /**
         * @type {EmbedVideo.LiveStream}
         * @private
         */
        this._stream = new LiveStream(this._video, options.persistent);

        style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = options.path + '/webcam.css';
        document.querySelector('head').appendChild(style);

        deck.addEventListener(
          'ready',
          /**
           * @this EmbedVideo.Plugin
           */
          function () {
            deck.addKeyBinding({ keyCode: options.toggleKeyCode, key: options.toggleKey}, () => {
              this.toggle()
              }
            );
          }.bind(this)
        );

        deck.addEventListener(
          'slidechanged',
          this.update.bind(this)
        );
      };

      /**
       * Update plugin status in DOM
       */
      Plugin.prototype.update = function () {
        var newVideoClass, enable;
        newVideoClass = this.getVideoClass(deck.getCurrentSlide());
        enable = this.isEnabled() && newVideoClass;
        if (this._stream.isActive() && !enable) {
          this._video.setAttribute('class', this._identfierClass);
          this._stream.stop();
        }
        if (enable) {
          this._video.setAttribute('class', this._identfierClass + ' ' + newVideoClass);
          this._stream.start();
        }
      };

      /**
       * Fetch the slide specific style class for the video element
       * from the `data-video` attribute.
       *
       * @param {HTMLElement} element
       * @returns {?string}
       */
      Plugin.prototype.getVideoClass = function (element) {
        if (element instanceof Element) {
          var nodeVideoClass = element.getAttribute('data-video');
          /**
           * @type {HTMLElement|ParentNode}
           */
          var node = element;
          do {
            if (node instanceof Element) {
              nodeVideoClass = node.getAttribute('data-video');
            }
            // nodeVideoClass = node.getAttribute('data-video');
            node = node.parentNode;
          } while (!nodeVideoClass && node);
          element.setAttribute('data-video', nodeVideoClass || 'false');
          return (
            nodeVideoClass &&
            nodeVideoClass !== 'false' &&
            nodeVideoClass !== 'blank'
          ) ? nodeVideoClass : null;
        }
        return null;
      };

      new Plugin(options);
      // deck.addEventListener('ready', (event) => {
      //   // event.currentSlide, event.indexh, event.indexv
      //   return new Plugin(options);
      // });

    },
  };
};

