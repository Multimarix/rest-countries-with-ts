import React, { useContext, useState, useEffect, useCallback } from "react";
import { AppContextType, Country, Region } from "./interfaces";
import { debounce } from "lodash";
import { isSearchError, paramGeneric, Functions } from "./utils/functions";
import Formatters = Functions.Formatters;
import axios from "axios";

const AppContext = React.createContext<AppContextType | null>(null);

// TYPES AND INTERFACES
interface ProviderProps {
  children: JSX.Element;
}

// OTHER FUNCTIONS AND GLOBALS

const PRODALL_URL = "https://restcountries.com/v3.1/all";
const SEARCH_BY_NAME = "https://restcountries.com/v3.1/name/";
const SEARCH_BY_REGION = "https://restcountries.com/v3.1/region";
const SEARCH_BY_LIST_OF_CODES = "https://restcountries.com/v3.1/alpha?codes=";

// ? MAIN COMPONENT
const AppProvider: React.FC<ProviderProps> = ({ children }) => {
  // * STATE VALUES
  const [searchQuery, setSearchQuery] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [allCountries, setAllCountries] = useState<Country[] | undefined>();
  const [error, setError] = useState({ msg: "", status: false });
  const [searchError, setSearchError] = useState({ msg: "", status: false });
  const [borderError, setBorderError] = useState({ msg: "", status: false });
  const [isLoading, setIsLoading] = useState(true);
  const [borders, setBorders] = useState<Country[] | undefined>();
  const [selected, setSelected] = useState<Region>("all");

  // * FUNCTIONS AND SIDE EFFECTS

  // ? FETCH ALL COUNTRIES
  const fetchAllCountries = async (url: string) => {
    try {
      setIsLoading(true);
      const response = await axios(url);
      const res: paramGeneric = response.data;
      let FRESH_ARR = Formatters.formatData(res);
      Functions.GenAndHelpers.cacheCountries(FRESH_ARR);
      setAllCountries(FRESH_ARR);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError((old) => {
        let newErr = {
          ...old,
          status: true,
          msg: "Something's wrong.. ☹🙁. Try again later..",
        };
        return newErr;
      });
    }
  };

  // ? FETCH COUNTRIES BY REGION
  const filterByRegion = async (val: Region) => {
    setInputVal("");
    setSearchError((oldMsg) => {
      let newMsg = { ...oldMsg, status: false, msg: "" };
      return newMsg;
    });
    if (val === "all") {
      fetchAllCountries(PRODALL_URL);
    } else {
      try {
        setIsLoading(true);
        const response = await axios(`${SEARCH_BY_REGION}/${val}`);
        const res: paramGeneric = response.data;
        let FRESH_ARR = Formatters.formatData(res, "region");
        setIsLoading(false);
        setAllCountries(FRESH_ARR);
      } catch (error) {
        setIsLoading(false);
        setError((old) => {
          let newErr = {
            ...old,
            status: true,
            msg: "An error occured!!. Try reloading..",
          };
          return newErr;
        });
      }
    }
  };

  // ? FIND BORDER COUNTRIES
  const findBorderCountries = async (codes: string) => {
    try {
      setBorders(undefined);
      const response = await axios(`${SEARCH_BY_LIST_OF_CODES}${codes}`);
      const res: paramGeneric = response.data;
      let FRESH_ARR = Formatters.formatData(res, "borders");
      setBorders(FRESH_ARR);
    } catch (error) {
      setBorderError((old) => {
        let newErr = {
          ...old,
          status: true,
          msg: "Unable to load border data.. Try reloading",
        };
        return newErr;
      });
    }
  };

  const handleSearchInputChange = useCallback(
    debounce((val: string) => {
      setSearchQuery(val);
    }, 500),
    []
  );

  // ? SEARCH FOR A COUNTRY
  const searchForCountries = async (query: string) => {
    try {
      setIsLoading(true);
      query = query.replace(/[^a-zA-Z ]/g, "");
      const response = await axios(`${SEARCH_BY_NAME}${query}`);
      const data = response.data;
      const FRESH_ARR = Formatters.formatData(data, "fullsearch");
      setAllCountries(FRESH_ARR);
      setIsLoading(false);
      setSearchError((oldMsg) => {
        let newMsg = { ...oldMsg, status: false, msg: "" };
        return newMsg;
      });
    } catch (error) {
      if (isSearchError(error)) {
        setSearchError((oldMsg) => {
          let newMsg = {
            ...oldMsg,
            status: true,
            msg: "Uh Oh, Country Not Found",
          };
          return newMsg;
        });
        setIsLoading(false);
      } else {
        setError((old) => {
          let newErr = {
            ...old,
            status: true,
            msg: "Oops!. An error occured!!. Try reloading..",
          };
          return newErr;
        });
        setIsLoading(false);
      }
    }
  };

  // SAVE SELECTED OPTION TO LOCAL STORAGE
  const saveOptToLocalStorage = (opt: Region) => {
    localStorage.setItem("regions-select", JSON.stringify(opt));
  };

  // GET SELECTED OPTION FROM LOCAL STORAGE
  const getOptFromLocalStorage = () => {
    const localOpt: Region = localStorage.getItem("regions-select")
      ? JSON.parse(localStorage.getItem("regions-select")!)
      : "all";
    return localOpt;
  };

  useEffect(() => {
    saveOptToLocalStorage("all");
    fetchAllCountries(PRODALL_URL);
  }, []);

  useEffect(() => {
    if (searchQuery === "" || inputVal === "") {
      setSearchError((oldMsg) => {
        let newMsg = { ...oldMsg, status: false, msg: "" };
        return newMsg;
      });
      setAllCountries(Functions.GenAndHelpers.getCachedCountries);
      return;
    }

    searchForCountries(searchQuery);
  }, [searchQuery]);

  // ! RETs...
  return (
    <AppContext.Provider
      value={{
        allCountries,
        isLoading,
        error,
        filterByRegion,
        saveOptToLocalStorage,
        getOptFromLocalStorage,
        findBorderCountries,
        borders,
        inputVal,
        searchError,
        setInputVal,
        handleSearchInputChange,
        borderError,
        selected,
        setSelected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// custom hook

const useGlobalContext = () => {
  return useContext(AppContext) as AppContextType;
};

export { AppProvider, useGlobalContext };
