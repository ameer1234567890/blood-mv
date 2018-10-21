$('.sidenav').sidenav();

$('.dropdown-trigger').dropdown();


window.onload = function() {
  var defaultPage = 'donors';
  var rootPath = '/v2/';
  var pages = {
    donors: { title: "Blood MV" },
    requests: { title: "Requests :: Blood MV" },
    requestsadd: { title: "Add Request :: Blood MV" },
    add: { title: "Add Donor :: Blood MV" },
    notify: { title: "Notify :: Blood MV" }
  }

  var navLinks = document.querySelectorAll('nav .container > ul > li > a, #nav-mobile > li > a');
  var contentElement = document.getElementById('content');

  var updateContent = function(stateObj, pageURL) {
    if (stateObj) {
      document.title = stateObj.title;
      $('#content').load(pageURL + ' #content > *', function(){
        $('.progress').hide();
      });
    }
  };

  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function(e) {
      e.preventDefault();
      $('.progress').show();
      var sidenavInstance = document.querySelectorAll('.sidenav')[0].M_Sidenav;
      sidenavInstance.close();
      var pageURL = this.attributes['href'].value;
      var pageData = pages[pageURL.replace(/\/v2/g, '').replace(/\//g, '')];
      if(!pageData) {
        pageData = pages[defaultPage];
      }
      updateContent(pageData, pageURL);
      history.pushState(pageData, pageData.title, pageURL);
    });
  }

  window.addEventListener('popstate', function(event) {
    var pageURL = event.currentTarget.location.pathname;
    updateContent(event.state, pageURL)
  });
};

$('.progress').hide();
