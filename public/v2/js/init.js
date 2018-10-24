/*jshint esversion: 6 */
/*globals $ */

$('.sidenav').sidenav();

$('.dropdown-trigger').dropdown();


// Lifted from https://codepen.io/matt-west/pen/FGHAK
window.onload = function() {
  var defaultPage = 'donors';
  var pages = {
    donors: { title: "Blood MV", menu_element: "donors" },
    requests: { title: "Requests :: Blood MV", menu_element: "requests" },
    requestsadd: { title: "Add Request :: Blood MV", menu_element: "requestsadd" },
    add: { title: "Add Donor :: Blood MV", menu_element: "add" },
    notify: { title: "Notify :: Blood MV", menu_element: "notify" }
  }

  var navLinks = document.querySelectorAll('nav .container > ul > li > a, #nav-mobile > li > a');
  var contentElement = '#content';
  var progressElement = '.progress';

  var updateContent = function(stateObj, pageURL) {
    if (stateObj) {
      $(contentElement).load(pageURL + ' #content > *', function(){
        document.title = stateObj.title;
        var desktopMenuElement = 'nav-d-' + stateObj.menu_element;
        var mobileMenuElement = 'nav-m-' + stateObj.menu_element;
        $('nav > .container > ul > li.active').removeClass('active');
        $('#nav-mobile > li.active').removeClass('active');
        $('#' + desktopMenuElement).addClass('active');
        $('#' + mobileMenuElement).addClass('active');
        $(progressElement).hide();
      });
    }
  };

  for (var i = 0; i < navLinks.length; i++) {
    if(!$(navLinks[i]).hasClass('dropdown-trigger')) {
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
  }

  window.addEventListener('popstate', function(event) {
    var pageURL = event.currentTarget.location.pathname;
    updateContent(event.state, pageURL)
  });
};


$('#search').on('keyup', function(event) {
  var searchElement = document.getElementById('search');
  var tableElement = document.getElementById('donors');
  tableSearch(searchElement, tableElement);
});


// Lifted from https://stackoverflow.com/a/43622296/289254
function tableSearch(searchElement, tableElement) {
  var filter = searchElement.value.toUpperCase();
  var filterOne = filter.split(' ')[0];
  var filterTwo = filter.split(' ')[1];
  var tr = tableElement.getElementsByTagName('tr');
  for (var i = 1; i < tr.length; i++) { // i should start from 1, not 0, if table header is to be always visible
    if(filterTwo) {
      if(tr[i].textContent.toUpperCase().indexOf(filterOne) > -1 && tr[i].textContent.toUpperCase().indexOf(filterTwo) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
      }
    } else {
      if(tr[i].textContent.toUpperCase().indexOf(filterOne) > -1) {
        tr[i].style.display = '';
      } else {
        tr[i].style.display = 'none';
      }      
    }
  }
}


$('.progress').hide();
