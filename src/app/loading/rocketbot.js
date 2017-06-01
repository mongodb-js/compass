$( document ).ready(function() {

    var removeCheck = function() {
      $( ".mms-icon-big-check" ).addClass("remove");
      $( ".mms-icon-big-check" ).removeClass("ready");
      $( "span.welcome" ).hide();
    }

    var checkReady = function() {
      $( ".mms-icon-big-check" ).addClass("ready");
      $( "span.welcome" ).show();
      window.setTimeout( removeCheck, 1800 );
    }

    var liftOff = function() {
      $( ".mms-icon-rocketbot" ).addClass("launch");// launch the robot up and off of the screen
      window.setTimeout( checkReady, 1200 );//wait until the robot is high enough and then fade in the big check
    }

    var startClouds = function() {
      $( ".mms-icon-rocketbot, .mms-icon-cloud-m, .mms-icon-cloud-l" ).removeClass("hover");//stop the robot hover
      $( ".mms-icon-cloud-m" ).addClass("panning");
      $( ".mms-icon-cloud-l" ).addClass("panning");
      $( "span.setting" ).fadeOut(1000);
      window.setTimeout( liftOff, 1200 );
    }

    window.setTimeout( startClouds, 1500 );//wait 3 seconds and let the robot hover then liftOff

});
