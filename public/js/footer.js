$(".nav-link").each(function(){if($(this).attr("href")==window.location.pathname)return $(this).addClass("active"),!1}),$(function(){""!=window.location.hash&&$("html, body").animate({scrollTop:$(window.location.hash).offset().top},1e3)});