import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const ItemSelectTrack = (props: any) => {
  const trackCodeToName = useMemo(() => {
    if (!props.value) return "";
    return props.tracks.find((track: any) => track.id === props.value)?.value;
  }, [props.value]);

  return (
    <div>
      <ItemSelect
        name={"Track"}
        id={props.value}
        value={trackCodeToName}
        values={props.tracks}
        onChange={props.onChange}
      />
    </div>
  );
};

const ItemSelectDriver = (props: any) => {
  const competitorId = useMemo(() => {
    return props.drivers.filter(
      (driver: any) => driver["CompetitorName"] === props.value,
    )[0]?.["CompetitorId"];
  }, [props.drivers]);

  return (
    <div>
      <ItemSelect
        name={"Driver"}
        id={competitorId}
        value={props.value}
        values={props.drivers}
        onChange={props.onChange}
      />
    </div>
  );
};

const ItemSelect = (props: any) => {
  const [activeSelection, setActiveSelection] = useState<boolean>(false);

  const clicked = useRef<boolean>();

  const withinSelectionArea = (box: any) => {
    const selectionArea = document
      .getElementById("selection-area")
      ?.getBoundingClientRect();

    if (!selectionArea) return null;

    if (box.clientX && box.clientY) {
      box["x"] = box.clientX;
      box["y"] = box.clientY;
      box["height"] = 0;
    }

    return (
      box.y > selectionArea.y &&
      box.y + box.height < selectionArea.y + selectionArea.height
    );
  };

  const scrollEndEvent = () =>
    setTimeout(() => {
      if (!clicked.current) return;

      const optionsHTML = document.getElementById("options");

      if (!optionsHTML) return;

      const options = Array.from(optionsHTML.children);

      for (let i = 0; i < options.length; i++) {
        const box = options[i].getBoundingClientRect();
        if (withinSelectionArea(box)) {
          selectItem(options[i].getAttribute("id"));
        }
      }
    }, 300);

  const activeAnimation = useRef<Element>();

  const onScrollEvent = () => {
    if (activeAnimation.current) {
      activeAnimation.current.classList.toggle("animate-infinite-scroll");
      activeAnimation.current = undefined;
    }
  };

  const isContentOutOfViewport = (element: Element) => {
    return element.clientWidth < element.children[0].clientWidth;
  };

  const onScrollEventAnimate = () => {
    const optionsHTML = document.getElementById("options");

    if (!optionsHTML) return;

    const options = Array.from(optionsHTML.children);

    for (let i = 0; i < options.length; i++) {
      const box = options[i].getBoundingClientRect();
      if (withinSelectionArea(box) && isContentOutOfViewport(options[i])) {
        activeAnimation.current = options[i].children[0];
        options[i].children[0].classList.toggle("animate-infinite-scroll");
      }
    }
  };

  useEffect(() => {
    clicked.current = false;
    const options = document.getElementById("options");

    if (!options) return;

    options.addEventListener("scrollend", scrollEndEvent);
    options.addEventListener("scrollend", onScrollEventAnimate);
    options.addEventListener("scroll", onScrollEvent);

    if (activeSelection)
      document
        .getElementById(props.id)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });

    return () => {
      options.removeEventListener("scrollend", scrollEndEvent);
      options.removeEventListener("scrollend", onScrollEventAnimate);
      options.removeEventListener("scroll", onScrollEvent);
    };
  }, [activeSelection]);

  const selectHighlighted = (event: any) => {
    const selectionArea = document
      .getElementById("selection-area")
      ?.getBoundingClientRect();

    if (!selectionArea) return;

    if (withinSelectionArea(event)) {
      const selectedItem = highlightedElement();

      if (selectedItem) selectItem(selectedItem);
    } else {
      setActiveSelection(false);
    }
  };

  const highlightedElement = () => {
    const optionsHTML = document.getElementById("options");

    if (!optionsHTML) return;

    const options: any = Array.from(optionsHTML.children);

    for (let i = 0; i < options.length; i++) {
      const box = options[i].getBoundingClientRect();
      if (withinSelectionArea(box)) {
        return options[i].getAttribute("id");
      }
    }
    return null;
  };

  const selectItem = (value: any) => {
    props.onChange(value);
    setActiveSelection(false);
  };

  const selectIndividualItem = (evt: any) => {
    evt.stopPropagation();
    if (withinSelectionArea(evt)) {
      selectItem(highlightedElement());
    } else {
      evt.target.scrollIntoView({ behavior: "smooth", block: "center" });
      clicked.current = true;
    }
  };

  return (
    <div>
      <div onClick={() => setActiveSelection(true)}>
        {props.name}:<br />{" "}
        <span className="truncate whitespace-nowrap">{props.value}</span>
      </div>
      {activeSelection && (
        <div>
          <div className="fixed left-0 top-0 h-full w-full backdrop-blur"></div>
          <div className="absolute left-0 top-0 h-full w-full overflow-hidden bg-[rgba(28,28,30,.5)]">
            <div className="h-full w-full">
              <div
                id="selection-area"
                className="pointer-events-none absolute top-[50vh] h-16 w-full -translate-y-1/2 bg-[rgba(255,255,255,.5)]"
              ></div>
              <div className="fixed bottom-0 right-0 m-4 flex">
                <button
                  className="flex h-16 w-24 items-center justify-center rounded-l-full border border-y-2 border-l-2 bg-red-800"
                  onClick={() => setActiveSelection(false)}
                >
                  <img
                    src="./cross.svg"
                    width="34"
                    height="34"
                    alt="My Happy SVG"
                  />
                </button>
                <button
                  className="flex h-16 w-24 items-center justify-center rounded-r-full border border-y-2 border-r-2 bg-green-900"
                  onClick={() => selectItem(highlightedElement())}
                >
                  <img
                    src="./tick.svg"
                    width="20"
                    height="20"
                    alt="My Happy SVG"
                  />
                </button>
              </div>
              <div
                onClick={selectHighlighted}
                id="options"
                className="flex h-full snap-y snap-mandatory flex-col gap-10 overflow-y-scroll px-5 py-[50vh]"
              >
                {props.values.map((value: any) => {
                  return (
                    <div
                      id={value.id}
                      key={value.id}
                      className="w-full snap-center overflow-x-clip whitespace-nowrap text-center text-2xl"
                      onClick={selectIndividualItem}
                    >
                      <div className="inline-block">{value.value}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ItemSelectTrack, ItemSelectDriver };
